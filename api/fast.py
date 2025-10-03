# api/fast.py
import os
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")  # CPU only

import logging
from functools import lru_cache
from typing import Any, Dict, List, Tuple, Optional

import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

import tensorflow as tf
from tensorflow.keras.models import load_model as keras_load_model
from tensorflow.keras.preprocessing import image as keras_image


# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nextpox-backend")


# -------------------- Preprocess --------------------
def preprocess_image(_image: Image.Image, size: int) -> np.ndarray:
    _image = _image.convert("RGB")
    img = _image.resize((size, size), Image.Resampling.LANCZOS)
    arr = keras_image.img_to_array(img, dtype=np.float32)  # (H,W,3)
    arr = arr / 255.0
    return np.expand_dims(arr, axis=0)  # (1,H,W,3)


# -------------------- Softmax --------------------
def softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    x = x - np.max(x, axis=axis, keepdims=True)
    e = np.exp(x)
    return e / np.sum(e, axis=axis, keepdims=True)


# -------------------- Model Adapters --------------------
class ModelAdapter:
    """Base: must implement predict(np.ndarray)->np.ndarray(batch, num_classes)."""
    def predict(self, x: np.ndarray) -> np.ndarray:
        raise NotImplementedError


class KerasModelAdapter(ModelAdapter):
    def __init__(self, path: str):
        # Two attempts: safe defaults, then safe_mode=False
        last_err = None
        for kwargs in (dict(compile=False), dict(compile=False, safe_mode=False)):
            try:
                self.model = keras_load_model(path, **kwargs)
                logger.info(f"Keras model loaded: {path} ({kwargs})")
                break
            except Exception as e:
                last_err = e
                logger.warning(f"Keras load failed ({kwargs}): {e}")
        if not hasattr(self, "model"):
            raise RuntimeError(f"Keras could not load model: {path}. Last error: {last_err}")

        # Multi-input check
        self._multi_input = isinstance(getattr(self.model, "input_shape", None), list) and len(self.model.input_shape) > 1

    def predict(self, x: np.ndarray) -> np.ndarray:
        try:
            if self._multi_input:
                preds = self.model.predict([x] * len(self.model.input_shape))
            else:
                preds = self.model.predict(x)
        except Exception as e:
            logger.error(f"Keras predict failed: {e}")
            raise

        return normalize_output(preds)


class SavedModelAdapter(ModelAdapter):
    def __init__(self, directory: str):
        sm = tf.saved_model.load(directory)
        fn = sm.signatures.get("serving_default")
        if fn is None:
            # fall back to any signature
            fn = next(iter(sm.signatures.values()))
        self._fn = fn
        # Cache input names
        _, input_spec = fn.structured_input_signature
        self._input_names: List[str] = list(input_spec.keys())
        logger.info(f"SavedModel signature inputs: {self._input_names}")

    def predict(self, x: np.ndarray) -> np.ndarray:
        xt = tf.convert_to_tensor(x)
        if len(self._input_names) <= 1:
            out = self._fn(xt)
        else:
            # replicate same tensor to all inputs
            feed = {name: xt for name in self._input_names}
            out = self._fn(**feed)
        preds = next(iter(out.values()))
        return normalize_output(preds.numpy())


class TFLiteAdapter(ModelAdapter):
    def __init__(self, path: str):
        self.interp = tf.lite.Interpreter(model_path=path)
        self.interp.allocate_tensors()
        self.input_details = self.interp.get_input_details()
        self.output_details = self.interp.get_output_details()
        logger.info(f"TFLite loaded: inputs={len(self.input_details)} outputs={len(self.output_details)}")

    def predict(self, x: np.ndarray) -> np.ndarray:
        # If multiple inputs, replicate x
        for i, inp in enumerate(self.input_details):
            self.interp.set_tensor(inp["index"], x.astype(inp["dtype"]))
        self.interp.invoke()
        # take first output
        out = self.interp.get_tensor(self.output_details[0]["index"])
        return normalize_output(out)


def normalize_output(preds: Any) -> np.ndarray:
    """Turn model output into (batch, num_classes) probabilities as best as possible."""
    if isinstance(preds, (list, tuple)):
        preds = preds[0]
    if isinstance(preds, dict):
        preds = next(iter(preds.values()))
    preds = np.array(preds)

    # If it's a spatial map (B,H,W,C), apply GAP then softmax
    if preds.ndim == 4:  # (B,H,W,C)
        preds = preds.mean(axis=(1, 2))  # (B,C)
        preds = softmax(preds, axis=-1)
        return preds

    if preds.ndim == 1:  # (C,)
        preds = np.expand_dims(preds, axis=0)

    # If values don't look like probabilities, softmax anyway
    if preds.ndim == 2 and (preds.min() < 0 or preds.max() > 1.0):
        preds = softmax(preds, axis=-1)

    return preds


# -------------------- Universal Loader --------------------
@lru_cache(maxsize=8)
def get_adapter(model_path: str) -> ModelAdapter:
    """Pick adapter by path type (keras/h5, dir SavedModel, tflite)."""
    if model_path.endswith((".keras", ".h5")):
        return KerasModelAdapter(model_path)
    if model_path.endswith(".tflite"):
        return TFLiteAdapter(model_path)
    if os.path.isdir(model_path):
        return SavedModelAdapter(model_path)
    # If unknown extension but exists as file, try Keras
    if os.path.isfile(model_path):
        return KerasModelAdapter(model_path)
    raise FileNotFoundError(f"Model not found: {model_path}")


# -------------------- Prediction Core --------------------
CLASS_LABELS = {0: 'acne', 1: 'chickenpox', 2: 'monkeypox', 3: 'non-skin', 4: 'normal'}
STAGE_LABELS = {0: 'stage_1', 1: 'stage_2', 2: 'stage_3', 3: 'stage_4'}

def run_model(model_path: str, img: Image.Image, size: int) -> Dict[str, Any]:
    x = preprocess_image(img, size)
    adapter = get_adapter(model_path)
    preds = adapter.predict(x)  # (1, C)

    if preds.ndim != 2 or preds.shape[0] < 1:
        raise RuntimeError(f"Unexpected prediction shape: {preds.shape}")

    probs = preds[0]
    pred_idx = int(np.argmax(probs))
    max_prob = float(np.max(probs))

    classes = {CLASS_LABELS.get(i, f"class_{i}"): float(round(float(p) * 100.0, 2))
               for i, p in enumerate(probs)}

    result = {
        "max_prob": max_prob,
        "predicted_class": CLASS_LABELS.get(pred_idx, f"class_{pred_idx}"),
        "class_probabilities": classes,
    }
    return result


def maybe_run_stage_model(predicted_class: str, x: np.ndarray, size: int) -> str:
    """Run stages model if needed. Uses same adapters."""
    if predicted_class != "monkeypox":
        return "stage_0"
    try:
        adapter = get_adapter("./models/stages.keras")  # can also be dir/tflite
        preds = adapter.predict(x)
        if preds.ndim == 1:
            preds = np.expand_dims(preds, 0)
        stage_idx = int(np.argmax(preds[0]))
        return STAGE_LABELS.get(stage_idx, "stage_0")
    except Exception as e:
        logger.warning(f"Stage model failed: {e}")
        return "stage_0"


# -------------------- FastAPI --------------------
application = FastAPI()

application.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        logger.info(f"Request: {request.method} {request.url}")
        resp = await call_next(request)
        logger.info(f"Response: {resp.status_code}")
        return resp

application.add_middleware(LoggingMiddleware)


@application.get("/predict/")
async def predict_endpoint(imageName: str, modelInputFeatureSize: int, modelFilename: str):
    try:
        img_path = f"./uploads/{imageName}"
        model_path = f"./models/{modelFilename}"

        if not os.path.exists(img_path):
            raise FileNotFoundError(f"Image not found: {img_path}")
        if not (os.path.isdir(model_path) or os.path.isfile(model_path)):
            raise FileNotFoundError(f"Model not found: {model_path}")

        img = Image.open(img_path)
        x = preprocess_image(img, modelInputFeatureSize)

        # main prediction
        main = run_model(model_path, img, modelInputFeatureSize)

        # stage (uses same adapters; reuses preprocessed x)
        stage = maybe_run_stage_model(main["predicted_class"], x, modelInputFeatureSize)

        main["predicted_stage"] = stage
        return {"classification": main}

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(application, host="0.0.0.0", port=7135)
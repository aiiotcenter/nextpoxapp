import os
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")  # force CPU only, avoid cuInit errors

import logging
from functools import lru_cache
from typing import Any, Dict, List, Tuple

import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# TF/Keras imports
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image as keras_image


# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nextpox-backend")


# -------------------- Preprocess --------------------
def preprocess_image(_image: Image.Image, size: int) -> np.ndarray:
    _image = _image.convert("RGB")
    img = _image.resize((size, size), Image.Resampling.LANCZOS)
    img_array = keras_image.img_to_array(img, dtype=np.float32)  # (H, W, 3)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)  # (1, H, W, 3)
    return img_array


# -------------------- SavedModel wrapper --------------------
class SavedModelWrapper:
    """
    Minimal wrapper to make a tf.saved_model.load(...) look like a Keras model
    with a .predict(np_array) that returns np.ndarray.
    It uses the 'serving_default' signature (or the first available).
    If multiple inputs are required, the same tensor is fed to all of them.
    """
    def __init__(self, sm: Any):
        self._sm = sm
        # choose signature
        self._fn = sm.signatures.get("serving_default")
        if self._fn is None:
            # take any signature
            if sm.signatures:
                self._fn = next(iter(sm.signatures.values()))
            else:
                raise RuntimeError("SavedModel has no signatures; cannot infer predict() entrypoint.")
        # cache input names for quick feeding
        _, input_spec = self._fn.structured_input_signature
        self._input_names: List[str] = list(input_spec.keys())
        logger.info(f"SavedModelWrapper using signature with inputs: {self._input_names}")

    def predict(self, x: np.ndarray) -> np.ndarray:
        # Convert to tensor
        xt = tf.convert_to_tensor(x)
        if len(self._input_names) <= 1:
            out = self._fn(xt)
        else:
            feed = {name: xt for name in self._input_names}
            out = self._fn(**feed)
        # pick first output
        first = next(iter(out.values()))
        return first.numpy()


# -------------------- Model loader (resilient) --------------------
@lru_cache(maxsize=4)
def get_model(model_path: str):
    """
    Try Keras load_model with safe_mode toggles; if that fails AND the path is a
    directory (SavedModel), fallback to tf.saved_model.load wrapped by SavedModelWrapper.
    """
    # 1) Keras load attempt (normal)
    try:
        model = load_model(model_path, compile=False)
        logger.info(f"Loaded Keras model: {model_path}")
        return model
    except Exception as e1:
        logger.error(f"Could not load model {model_path} with Keras: {e1}")

    # 2) Keras load attempt with safe_mode=False (Keras 3)
    try:
        model = load_model(model_path, compile=False, safe_mode=False)  # <-- extra attempt
        logger.info(f"Loaded Keras model (safe_mode=False): {model_path}")
        return model
    except Exception as e2:
        logger.error(f"Keras (safe_mode=False) also failed for {model_path}: {e2}")

    # 3) SavedModel fallback ONLY if the path is a directory
    if os.path.isdir(model_path):
        try:
            sm = tf.saved_model.load(model_path)
            logger.info(f"Loaded SavedModel directory: {model_path}")
            return SavedModelWrapper(sm)
        except Exception as e3:
            logger.error(f"Could not load SavedModel from {model_path}: {e3}")

    # If we reach here, there is no viable way to load this file inside this runtime
    raise RuntimeError(
        "Failed to load model. If your model is a .keras file that encodes multiple inputs, "
        "please re-export a single-input model or export a SavedModel directory."
    )
# -------------------- Prediction core --------------------
def predict_image(model: Any, _image: Image.Image, size: int) -> Dict[str, Any]:
    labels = {0: 'acne', 1: 'chickenpox', 2: 'monkeypox', 3: 'non-skin', 4: 'normal'}

    pre = preprocess_image(_image, size)
    logger.info(f"Preprocessed image shape: {pre.shape}")

    # If Keras model exposes input_shape as list, we can replicate feed at predict time.
    # SavedModelWrapper handles multi-input internally already.
    try:
        if hasattr(model, "input_shape") and isinstance(model.input_shape, list) and len(model.input_shape) > 1:
            preds = model.predict([pre] * len(model.input_shape))
        else:
            preds = model.predict(pre)
    except Exception as e:
        # One more fallback: some models return dicts or tuples
        logger.error(f"Model prediction failed: {e}")
        raise

    # Ensure we have a 2D array (batch, num_classes)
    if isinstance(preds, (list, tuple)):
        preds = preds[0]
    if isinstance(preds, dict):
        preds = next(iter(preds.values()))
    preds = np.array(preds)

    if preds.ndim == 1:
        preds = np.expand_dims(preds, axis=0)

    if preds.shape[0] == 0:
        raise RuntimeError("Model returned empty predictions.")

    probs = preds[0]
    max_prob = float(np.max(probs))
    pred_idx = int(np.argmax(probs))
    predicted_class = labels.get(pred_idx, f"class_{pred_idx}")
    class_probs = {labels.get(i, f"class_{i}"): float(round(float(p) * 100.0, 2)) for i, p in enumerate(probs)}

    # Monkeypox stage model (optional)
    predicted_stage = "stage_0"
    if predicted_class == "monkeypox":
        try:
            stages_model = get_model("./models/stages.keras")
            c = stages_model.predict(pre)
            if isinstance(c, (list, tuple)):
                c = c[0]
            if isinstance(c, dict):
                c = next(iter(c.values()))
            c = np.array(c)
            if c.ndim == 1:
                c = np.expand_dims(c, axis=0)

            labels_stages = {0: 'stage_1', 1: 'stage_2', 2: 'stage_3', 3: 'stage_4'}
            predicted_stage = labels_stages.get(int(np.argmax(c[0])), "stage_0")
        except Exception as e:
            logger.warning(f"Stage prediction failed: {e}")

    return {
        "max_prob": max_prob,
        "predicted_class": predicted_class,
        "class_probabilities": class_probs,
        "predicted_stage": predicted_stage,
    }


def predict_with_image(_image: Image.Image, model_path: str, size: int) -> Dict[str, Any]:
    model = get_model(model_path)
    return predict_image(model, _image, size)


# -------------------- FastAPI app --------------------
application = FastAPI()

application.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust if you want to restrict
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
async def get_results(imageName: str, modelInputFeatureSize: int, modelFilename: str):
    try:
        # read image
        path = f"./uploads/{imageName}"
        img = Image.open(path)

        # resolve model
        model_path = f"./models/{modelFilename}"

        result = predict_with_image(img, model_path, modelInputFeatureSize)
        return {"classification": result}

    except Exception as e:
        logger.error(f"Error occurred while processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(application, host="0.0.0.0", port=7135)
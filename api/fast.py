import os
# ── force CPU + quiet TF logs BEFORE importing TF ─────────────────────────────
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from functools import lru_cache
import logging
from typing import Tuple

import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image as keras_image

# ── config ───────────────────────────────────────────────────────────────────
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
MODELS_DIR = "/app/models"

LABELS = {0: "acne", 1: "chickenpox", 2: "monkeypox", 3: "non-skin", 4: "normal"}
STAGES_LABELS = {0: "stage_1", 1: "stage_2", 2: "stage_3", 3: "stage_4"}
STAGES_MODEL_FILENAME = "stages.keras"  # inside /app/models

# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nextpox-backend")


# ── utils ────────────────────────────────────────────────────────────────────
def preprocess_image(pil_image: Image.Image, size: int) -> np.ndarray:
    """Convert PIL image -> normalized NCHW batch (1, H, W, 3)."""
    pil_image = pil_image.convert("RGB")
    # Pillow >=9 uses Image.Resampling; keep fallback for older versions
    resample = getattr(Image, "Resampling", Image).LANCZOS
    pil_image = pil_image.resize((size, size), resample=resample)
    arr = keras_image.img_to_array(pil_image, dtype=np.uint8)  # (H, W, 3)
    arr = arr / 255.0
    arr = np.expand_dims(arr, axis=0)  # (1, H, W, 3)
    return arr


@lru_cache(maxsize=4)
def load_main_model(model_filename: str) -> Tuple[tf.keras.Model, int]:
    """Load and cache the main classification model. Returns (model, input_count)."""
    path = os.path.join(MODELS_DIR, model_filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"model not found: {path}")
    model = load_model(path, compile=False)
    input_count = len(model.inputs)
    shapes = [tuple(t.shape) for t in model.inputs]
    logger.info(f"[model] loaded {model_filename} | inputs={input_count} shapes={shapes}")
    return model, input_count


@lru_cache(maxsize=1)
def load_stages_model() -> tf.keras.Model:
    """Load and cache the stages model (used only for monkeypox)."""
    path = os.path.join(MODELS_DIR, STAGES_MODEL_FILENAME)
    if not os.path.exists(path):
        raise FileNotFoundError(f"stages model not found: {path}")
    model = load_model(path, compile=False)
    logger.info(f"[stages] loaded {STAGES_MODEL_FILENAME} | inputs={len(model.inputs)}")
    return model


def run_main_predict(model: tf.keras.Model, input_count: int, x: np.ndarray) -> np.ndarray:
    """
    Run prediction, handling models that expect 1 or 2 inputs.
    Hotfix for two-input graphs: feed the same tensor twice.
    """
    if input_count == 1:
        return model.predict(x)
    if input_count == 2:
        return model.predict([x, x])
    raise RuntimeError(f"Unsupported input count: {input_count}")


# ── FastAPI app ──────────────────────────────────────────────────────────────
application = FastAPI()

application.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for prod if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        logger.info(f"Request: {request.method} {request.url}")
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response


application.add_middleware(LoggingMiddleware)


@application.get("/healthz")
def health():
    return {"ok": True}


@application.get("/predict/")
async def get_results(
    imageName: str,
    modelInputFeatureSize: int,
    modelFilename: str,
):
    """
    Example:
    /predict/?imageName=foo.jpg&modelInputFeatureSize=300&modelFilename=model_10-0.92.keras
    """
    try:
        img_path = os.path.join(UPLOAD_DIR, imageName)
        if not os.path.exists(img_path):
            raise HTTPException(status_code=404, detail=f"file not found: {img_path}")

        # Load image
        img = Image.open(img_path)
        x = preprocess_image(img, modelInputFeatureSize)
        logger.info(f"Preprocessed image shape: {x.shape}")
        if x.shape != (1, modelInputFeatureSize, modelInputFeatureSize, 3):
            raise HTTPException(status_code=400, detail=f"Unexpected image tensor shape {x.shape}")

        # Load model once
        model, input_count = load_main_model(modelFilename)

        # Predict classes
        pred = run_main_predict(model, input_count, x)  # shape (1, C)
        probs = pred[0]  # (C,)
        max_prob = float(np.max(probs))
        class_idx = int(np.argmax(probs))
        predicted_class = LABELS.get(class_idx, f"class_{class_idx}")

        classes = {LABELS.get(i, f"class_{i}"): float(round(p * 100.0, 2)) for i, p in enumerate(probs)}

        # Optional stages model for 'monkeypox'
        predicted_stage = "stage_0"
        if predicted_class == "monkeypox":
            try:
                stages_model = load_stages_model()
                stage_pred = stages_model.predict(x)  # assumes same input format
                stage_idx = int(np.argmax(stage_pred[0]))
                predicted_stage = STAGES_LABELS.get(stage_idx, f"stage_{stage_idx}")
            except FileNotFoundError as e:
                logger.warning(f"[stages] {e} (skipping stages)")
            except Exception as e:
                logger.warning(f"[stages] error: {e} (skipping stages)")

        return {
            "classification": {
                "max_prob": max_prob,
                "predicted_class": predicted_class,
                "class_probabilities": classes,
                "predicted_stage": predicted_stage,
            }
        }

    except HTTPException:
        raise
    except FileNotFoundError as e:
        logger.error(str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error occurred while processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(application, host="0.0.0.0", port=7135)
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------- Preprocessing --------------------
def preprocess_image(_image, size):
    _image = _image.convert("RGB")
    img = _image.resize((size, size), Image.Resampling.LANCZOS)
    img_array = image.img_to_array(img, dtype=np.float32)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)  # (1, H, W, C)
    return img_array

# -------------------- Model Loading (cached) --------------------
@lru_cache(maxsize=3)
def get_model(model_path: str):
    try:
        model = load_model(model_path, compile=False)
        logger.info(f"Loaded model from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Could not load model {model_path}: {e}")
        raise

# -------------------- Prediction --------------------
def predictWithImage(_image, model_name, size):
    loaded_model = get_model(model_name)
    return predict_image(loaded_model, _image, size)

def predict_image(model, _image, size):
    labels = {0: 'acne', 1: 'chickenpox', 2: 'monkeypox', 3: 'non-skin', 4: 'normal'}
    preprocessed_image = preprocess_image(_image, size)

    logger.info(f"Preprocessed image shape: {preprocessed_image.shape}")

    # If the model expects multiple inputs, feed the same tensor to all
    try:
        if isinstance(model.input_shape, list) and len(model.input_shape) > 1:
            preds = model.predict([preprocessed_image] * len(model.input_shape))
        else:
            preds = model.predict(preprocessed_image)
    except Exception as e:
        logger.error(f"Model prediction failed: {e}")
        raise

    max_prob = float(np.max(preds[0]))
    predicted_class = labels[np.argmax(preds[0])]

    classes = {labels[i]: float(round(prob * 100, 2)) for i, prob in enumerate(preds[0])}

    # Load and use the stages model only for monkeypox
    predicted_stage = "stage_0"
    if predicted_class == 'monkeypox':
        try:
            stages_model = get_model('./models/stages.keras')
            labels_stages = {0: 'stage_1', 1: 'stage_2', 2: 'stage_3', 3: 'stage_4'}
            c = stages_model.predict(preprocessed_image)
            predicted_stage = labels_stages[np.argmax(c[0])]
        except Exception as e:
            logger.warning(f"Stage prediction failed: {e}")

    return {
        "max_prob": max_prob,
        "predicted_class": predicted_class,
        "class_probabilities": classes,
        "predicted_stage": predicted_stage
    }

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
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response

application.add_middleware(LoggingMiddleware)

@application.get("/predict/")
async def get_results(imageName: str, modelInputFeatureSize: int, modelFilename: str):
    try:
        url = f"./uploads/{imageName}"
        img = Image.open(url)
        model_path = "./models/" + modelFilename
        result = predictWithImage(img, model_path, modelInputFeatureSize)
        return {"classification": result}
    except Exception as e:
        logger.error(f"Error occurred while processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(application, host="0.0.0.0", port=7135)
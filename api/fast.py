from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)  # Set to DEBUG for more verbosity
logger = logging.getLogger(__name__)

def preprocess_image(_image, size):
    _image = _image.convert("RGB")
    img = _image.resize((size, size), Image.Resampling.LANCZOS)
    img_array = image.img_to_array(img, dtype=np.uint8)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    return img_array

def predictWithImage(_image, model_name, size):
    loaded_model = load_model(model_name)
    return predict_image(loaded_model, _image, size)

def predict_image(model, _image, size):
    labels = {0: 'acne', 1: 'chickenpox', 2: 'monkeypox', 3: 'non-skin', 4: 'normal'}
    preprocessed_image = preprocess_image(_image, size)

    # Log preprocessed image shape
    logger.info(f"Preprocessed image shape: {preprocessed_image.shape}")
    assert preprocessed_image.shape == (1, size, size, 3), f"Unexpected shape: {preprocessed_image.shape}"

    # Main prediction
    prediction = model.predict(preprocessed_image)
    max_prob = float(np.max(prediction[0]))  # Convert to native Python float
    predicted_class = labels[np.argmax(prediction[0])]

    # Convert probabilities to native Python float
    classes = {labels[i]: float(round(j * 100, 2)) for i, j in enumerate(prediction[0])}

    # Load and use the stages model if necessary
    stages_model = load_model('./models/stages.keras')
    logger.debug(f"Stages model input shape: {stages_model.input_shape}")
    labels_stages = {0: 'stage_1', 1: 'stage_2', 2: 'stage_3', 3: 'stage_4'}
    predicted_stage = "stage_0"

    if predicted_class == 'monkeypox':
        logger.debug(f"Shape for stages model prediction: {preprocessed_image.shape}")
        # No need to add np.newaxis; preprocessed_image already has batch dimension
        c = stages_model.predict(preprocessed_image)
        predicted_stage = labels_stages[np.argmax(c[0])]

    return {
        "max_prob": max_prob,
        "predicted_class": predicted_class,
        "class_probabilities": classes,
        "predicted_stage": predicted_stage
    }

# Create FastAPI instance
application = FastAPI()

# Set up CORS
application.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can specify your domain here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging Middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        logger.info(f"Request: {request.method} {request.url}")
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response

application.add_middleware(LoggingMiddleware)

@application.get("/predict/")
async def get_results(
    imageName: str,
    modelInputFeatureSize: int,
    modelFilename: str,
):
    try:
        url = f"./uploads/{imageName}" # Might be a problem
        img = Image.open(url)
        model_name = "./models/" + modelFilename
        result = predictWithImage(img, model_name, modelInputFeatureSize)

        return {"classification": result}

    except Exception as e:
        logger.error(f"Error occurred while processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(application, host="0.0.0.0", port=7135)

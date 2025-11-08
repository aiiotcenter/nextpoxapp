# Vector Classification Application

A full-stack application for identifying disease-carrying vectors (mosquitoes, ticks, fleas, bed bugs) using deep learning.

## Features

- 🦟 Real-time vector classification using EfficientNet-B5
- 📸 Image upload and analysis
- 🤖 AI-powered Q&A about identified vectors
- 📊 Confidence scores and detailed explanations
- 🔄 User feedback and classification correction

## Tech Stack

**Frontend:** Next.js, TypeScript, React  
**Backend:** Flask, PyTorch, TorchVision  
**Model:** EfficientNet-B5 (binary classification)

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- Git

### 1. Clone Repositories

```bash
# Frontend
git clone https://github.com/aiiotcenter/nextpoxapp.git
cd nextpoxapp/poxapp
npm install

# Backend (in a separate terminal)
git clone https://github.com/el-rapido/VectorBackend.git
cd VectorBackend
```

### 2. Download Model Weights

Download the Aedes model by reaching out to wisdomlotachukwu@gmail.com for the link and place it at:

```
VectorBackend/models/aedes/best_model_20251020_185558.pth
```

Download the Culex model by reaching out to wisdomlotachukwu@gmail.com for the link and place it at:

```
VectorBackend/models/culex/best_model_20251020_185558.pth
```

### 3. Backend Setup

```bash
# Create virtual environment
python -m venv fresh_venv

# Activate it
# Windows:
.\fresh_venv\Scripts\activate
# macOS/Linux:
source fresh_venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# If using Python 3.12+ and facing conflicts, use this instead:
pip install Flask==3.0.0 flask-cors==4.0.0 torch>=2.3.1 torchvision==0.18.1 timm==0.9.12 Pillow==10.1.0 numpy>=1.26.0 Werkzeug==3.0.1

# Run backend server
python vector.py
```

Backend will start at `http://localhost:5000`

### 4. Frontend Setup

```bash
cd poxapp

# Create .env.local file
echo "OPENAI_API_KEY=your_api_key_here" > .env.local

# Start development server
npm run dev
```

Frontend will start at `http://localhost:3000`

### 5. Optional: AI Q&A Feature

To enable the "Ask AI" feature:

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to `poxapp/.env.local`:

```
   OPENAI_API_KEY=sk-proj-your_key_here
```

3. Restart the frontend server

**Note:** OpenAI provides $5 free credit for new accounts. The app works without this feature.

---

## Usage

1. Navigate to `http://localhost:3000/classify`
2. Click "Upload Image for Classification"
3. Select an image of a vector (currently supports Aedes mosquitoes)
4. View classification results and confidence score
5. Ask questions about the identified vector using the AI assistant

---

## Current Limitations

- Only **Aedes mosquito** and **Culex Mosquito** model is currently available
- Other vectors (Anopheles, Bed Bug, Flea, Tick) coming soon
- Backend runs locally only (not deployed)

---

## Project Structure

```
nextpoxapp/
├── poxapp/              # Next.js frontend
│   ├── app/
│   │   ├── (pages)/
│   │   │   ├── classify/   # Main classification page
│   │   │   └── dashboard/  # Vector showcase
│   │   └── api/
│   │       └── askgpt/     # AI Q&A endpoint
│   └── .env.local          # API keys (create this)

VectorBackend/
├── vector.py            # Flask API server
├── models/
│   └── aedes/          # Model weights (download separately)
├── requirements.txt
└── fresh_venv/         # Virtual environment (create this)
```

---

## API Endpoints

### Backend (Flask)

- `GET /api/health` - Health check
- `GET /api/models` - List available models
- `POST /api/predict` - Classify image
  - Form data: `image` (file), `insect_type` (string)

### Frontend (Next.js)

- `POST /api/askgpt` - AI-powered Q&A
- `POST /api/upload` - Image upload handler

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

---

## License

[Add your license here]

## Acknowledgments

- Model training by [AI IoT Center](https://github.com/aiiotcenter)
- EfficientNet architecture by Google Research

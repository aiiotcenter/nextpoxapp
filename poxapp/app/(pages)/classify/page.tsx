"use client";
import React, { ChangeEvent, useState } from "react";
import { Popup, PopupBody } from "@/app/components/Popup";
import "@/app/styles/main.css";
import "@/app/styles/reviewpopup.css";
import "@/app/styles/changePrediction.css";
import useFileUpload from "@/app/hooks/useFileUpload";
import Loader from "@/app/components/Loader/Loader";

const DOMAIN = "http://mpoxapp.aiiot.center";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// Mapping backend vector types to display names
const vectorDisplayNames: Record<string, string> = {
    "aedes": "Aedes Mosquito",
    "culex": "Culex Mosquito",
    "pediculus": "Pediculus Humanus Capitis",
    "cimex": "Cimex Lectularius",
    "ixodes": "Ixodes Ricinus",
    "ctenocephalides": "Ctenocephalides Felis"
};

interface AllPredictions {
    [key: string]: {
        probability: number;
        probabilities: {
            [key: string]: number;
        };
        description: string;
    };
}

interface PredictionResult {
    primary_prediction: {
        vector_type: string;
        confidence: number;
        description: string;
    };
    all_predictions: AllPredictions;
    confidence_level: string;
    timestamp: string;
    warning?: string;
}

export default function VectorClassifier() {
    const [predictionPopup, setPredictionPopup] = useState(false);
    const [reviewPopup, setReviewPopup] = useState(false);
    const [showDetailedResults, setShowDetailedResults] = useState(false);
    const [imageURL, setImageURL] = useState<undefined | string>(undefined);
    const [image, setImage] = useState<undefined | File>(undefined);
    const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
    const [userQuestion, setUserQuestion] = useState("");
    const [isPredicting, setIsPredicting] = useState(false);
    const [aiResponse, setAiResponse] = useState("");

    const { uploadFile } = useFileUpload();

    async function handleAskQuestion() {
        if (!predictionResult || !userQuestion.trim()) {
            alert("Please ensure you have a classification result and enter a question.");
            return;
        }

        try {
            setAiResponse("Thinking...");
            
            const prediction = predictionResult.primary_prediction.vector_type;
            const question = userQuestion.trim();

            const result = await fetch("/api/askgpt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prediction, question }),
            });
            
            const data = await result.json();
            setAiResponse(data.answer || "No response received.");
        } catch (error) {
            console.error(error);
            setAiResponse("Failed to get AI response. Please try again.");
        }
    }

    async function startPrediction() {
        if (!image) return;

        try {
            setIsPredicting(true);

            // Upload file first
            const uploadResult = await uploadFile(image);
            const fileName = uploadResult.split("/uploads/")[1];

            // Prepare form data for Flask backend
            const formData = new FormData();
            formData.append('image', image);
            // NO insect_type needed anymore - backend runs all models

            // Call Flask backend
            const response = await fetch(`${BACKEND_URL}/api/predict`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                alert(`Prediction failed: ${data.error}`);
                setIsPredicting(false);
                return;
            }

            // Store the full prediction result
            setPredictionResult(data.result);

            // Generate AI explanation
            const primaryPred = data.result.primary_prediction;
            const confidence = (primaryPred.confidence * 100).toFixed(1);
            
            let explanation = "";
            if (data.result.warning) {
                explanation = data.result.warning;
            } else {
                explanation = `Based on multi-model analysis, this has been identified as ${vectorDisplayNames[primaryPred.vector_type]} with ${confidence}% confidence. ${primaryPred.description}\n\nThe image was analyzed by all 6 vector classification models simultaneously.`;
            }
            
            setAiResponse(explanation);

            setImage(undefined);
            setPredictionPopup(false);
            setIsPredicting(false);
            setReviewPopup(true);
        } catch (error) {
            console.error('Prediction error:', error);
            alert('Classification failed. Make sure the backend is running.');
            setIsPredicting(false);
        }
    }

    function handlePredictingImageChange(event: ChangeEvent<HTMLInputElement>) {
        try {
            if (event.target.files) {
                const file = event.target.files[0];
                setImage(file);
                const url = URL.createObjectURL(file);
                setImageURL(url);
            }
        } catch (error) {
            setImageURL(undefined);
            setImage(undefined);
            console.error(error);
        }
    }

    // Sort all predictions by probability descending
    const getSortedPredictions = () => {
        if (!predictionResult) return [];
        
        return Object.entries(predictionResult.all_predictions)
            .map(([vectorType, data]) => ({
                vectorType,
                displayName: vectorDisplayNames[vectorType] || vectorType,
                probability: data.probability,
                description: data.description
            }))
            .sort((a, b) => b.probability - a.probability);
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ textAlign: "center", color: "#780000", fontSize: "40px", fontWeight: 700 }}>
                Vector Classification
            </h1>
            <h2 style={{ textAlign: "center", color: "#010101", fontSize: "24px", fontWeight: 400, marginBottom: "30px" }}>
                Upload an image to identify disease-carrying vectors
            </h2>

            <div className="predict-button-container" onClick={() => setPredictionPopup(true)}>
                <div className="button">Upload Image for Classification</div>
            </div>

            {/* Upload Popup */}
            {predictionPopup && (
                <Popup
                    title="Upload Image for Classification"
                    onClose={() => {
                        setPredictionPopup(false);
                        setImageURL(undefined);
                        setImage(undefined);
                    }}
                >
                    <PopupBody>
                        <div className="popup-body predict-body">
                            <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '8px'}}>
                                <p style={{margin: 0, fontSize: '14px', color: '#333'}}>
                                    Your image will be automatically analyzed by all 6 vector classification models simultaneously.
                                </p>
                            </div>
                            
                            <div className="image-upload-wrapper" onClick={() => document.getElementById('file-input')?.click()}>
                                {!imageURL && <div className="select-image">Click to select an image</div>}
                                {imageURL && <img src={imageURL} alt="Preview" />}
                            </div>
                            <input
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={handlePredictingImageChange}
                                style={{ display: 'none' }}
                            />
                            {image && (
                                <button className="button" onClick={startPrediction} disabled={isPredicting}>
                                    {isPredicting ? "Classifying..." : "Start Classification"}
                                </button>
                            )}
                        </div>
                        {isPredicting && <Loader />}
                    </PopupBody>
                </Popup>
            )}

            {/* Results Popup */}
            {reviewPopup && predictionResult && (
                <Popup
                    title="Classification Results"
                    onClose={() => {
                        setReviewPopup(false);
                        setImageURL(undefined);
                        setPredictionResult(null);
                        setShowDetailedResults(false);
                    }}
                >
                    <PopupBody size={{ width: "70vw", height: "auto" }}>
                        <div className="prediction-view-body">
                            <div className="image-view-wrapper">
                                {!imageURL && <Loader />}
                                {imageURL && <img className="image-review-view" alt="Classified vector" src={imageURL} />}
                                <div className="gpt-ask-container">
                                    <input
                                        type="text"
                                        placeholder="Ask about the classification..."
                                        value={userQuestion}
                                        onChange={(e) => setUserQuestion(e.target.value)}
                                    />
                                    <button type="button" onClick={handleAskQuestion}>Ask AI</button>
                                </div>
                            </div>

                            <div className="image-view-details-wrapper">
                                {/* Primary Prediction */}
                                <div className="stretch-container simple-grid">
                                    <div className="simple-grid">
                                        <p className="subheading">Primary Classification</p>
                                        <p className="stand-out">
                                            {vectorDisplayNames[predictionResult.primary_prediction.vector_type]}
                                        </p>
                                    </div>
                                </div>

                                {/* Confidence Score */}
                                <div className="stretch-container simple-grid">
                                    <div className="simple-grid">
                                        <p className="subheading">Confidence Score</p>
                                        <p className="stand-out" style={{fontSize: '24px', color: '#780000'}}>
                                            {(predictionResult.primary_prediction.confidence * 100).toFixed(2)}%
                                        </p>
                                    </div>
                                </div>

                                {/* Confidence Level */}
                                <div className="stretch-container simple-grid">
                                    <div className="simple-grid">
                                        <p className="subheading">Confidence Level</p>
                                        <p className="stand-out" style={{
                                            color: predictionResult.confidence_level === 'high' ? '#28a745' : 
                                                   predictionResult.confidence_level === 'medium' ? '#ffc107' : '#dc3545'
                                        }}>
                                            {predictionResult.confidence_level.toUpperCase()}
                                        </p>
                                    </div>
                                </div>

                                {/* View Detailed Results Button */}
                                <div className="stretch-container">
                                    <button 
                                        type="button"
                                        className="button" 
                                        onClick={(e) => {
                                            e.stopPropagation();  
                                            setShowDetailedResults(prev => !prev);
                                        }}
                                        style={{width: '100%', marginTop: '10px'}}
                                    >
                                        {showDetailedResults ? 'Hide' : 'View'} Detailed Results
                                    </button>
                                </div>

                                {/* Detailed Results Table */}
                                {showDetailedResults && (
                                    <div className="stretch-container" style={{marginTop: '15px'}}>
                                        <p className="subheading" style={{marginBottom: '10px'}}>All Model Predictions</p>
                                        <div style={{
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            backgroundColor: '#f9f9f9'
                                        }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                fontSize: '12px'
                                            }}>
                                                <thead style={{
                                                    backgroundColor: '#780000',
                                                    color: 'white',
                                                    position: 'sticky',
                                                    top: 0
                                                }}>
                                                    <tr>
                                                        <th style={{padding: '10px', textAlign: 'left'}}>Vector Type</th>
                                                        <th style={{padding: '10px', textAlign: 'center'}}>Confidence</th>
                                                        <th style={{padding: '10px', textAlign: 'left'}}>Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getSortedPredictions().map((pred, index) => (
                                                        <tr key={pred.vectorType} style={{
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f0f0f0',
                                                            borderBottom: '1px solid #ddd'
                                                        }}>
                                                            <td style={{padding: '10px', fontWeight: index === 0 ? 'bold' : 'normal'}}>
                                                                {pred.displayName}
                                                            </td>
                                                            <td style={{
                                                                padding: '10px', 
                                                                textAlign: 'center',
                                                                fontWeight: index === 0 ? 'bold' : 'normal',
                                                                color: index === 0 ? '#780000' : 'inherit'
                                                            }}>
                                                                {(pred.probability * 100).toFixed(2)}%
                                                            </td>
                                                            <td style={{padding: '10px', fontSize: '11px'}}>
                                                                {pred.description}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* AI Explanation */}
                                <div className="stretch-container">
                                    <div className="simple-grid">
                                        <p className="subheading">AI Explanation</p>
                                        <p className="stand-out" style={{ fontSize: "12px", whiteSpace: 'pre-line' }}>
                                            {aiResponse || "Loading..."}
                                        </p>
                                    </div>
                                </div>

                                {/* Warning if present */}
                                {predictionResult.warning && (
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: '#fff3cd',
                                        border: '1px solid #ffc107',
                                        borderRadius: '8px',
                                        marginTop: '10px'
                                    }}>
                                        <p style={{margin: 0, fontSize: '12px', color: '#856404'}}>
                                            {predictionResult.warning}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </PopupBody>
                </Popup>
            )}
        </div>
    );
}
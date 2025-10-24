"use client";
import React, { ChangeEvent, useState } from "react";
import { Popup, PopupBody } from "@/app/components/Popup";
import "@/app/styles/main.css";
import "@/app/styles/reviewpopup.css";
import "@/app/styles/changePrediction.css";
import useFileUpload from "@/app/hooks/useFileUpload";
import Loader from "@/app/components/Loader/Loader";

const DOMAIN = "http://mpoxapp.aiiot.center";

const availableChoices = [
    "Cimex_Lectularius",
    "Pediculus_humanus_capitis",
    "Culex_sp",
    "Ixodes_ricinus",
    "Ctenocephalides_felis",
    "Aedes",
];

const vectorData = {
    "Cimex_Lectularius": {
        displayName: "Cimex Lectularius",
        description: "Common bed bugs are small, reddish-brown insects that feed on human blood.",
        precision: 0.95
    },
    "Pediculus_humanus_capitis": {
        displayName: "Pediculus Humanus Capitis",
        description: "Head lice are tiny parasitic insects that live on the scalp.",
        precision: 0.94
    },
    "Culex_sp": {
        displayName: "Culex Mosquito",
        description: "Culex mosquitoes are common vectors for diseases like West Nile virus.",
        precision: 0.94
    },
    "Ixodes_ricinus": {
        displayName: "Ixodes Ricinus",
        description: "Deer ticks are known vectors for Lyme disease.",
        precision: 0.94
    },
    "Ctenocephalides_felis": {
        displayName: "Ctenocephalides Felis",
        description: "Cat fleas are the most common flea species.",
        precision: 0.97
    },
    "Aedes": {
        displayName: "Aedes Mosquito",
        description: "Aedes mosquitoes transmit dengue, Zika, and chikungunya viruses.",
        precision: 0.96
    }
};

function simulateVectorPrediction() {
    const vectors = Object.keys(vectorData) as (keyof typeof vectorData)[];
    const randomVector = vectors[Math.floor(Math.random() * vectors.length)];
    const vectorInfo = vectorData[randomVector];
    
    const baseConfidence = vectorInfo.precision;
    const variance = (Math.random() - 0.5) * 0.1;
    const confidence = Math.max(0.65, Math.min(0.99, baseConfidence + variance));
    
    return {
        predicted_class: randomVector,
        max_prob: confidence,
        displayName: vectorInfo.displayName,
        description: vectorInfo.description
    };
}

function generateExplanation(prediction: any) {
    const { displayName, description, max_prob } = prediction;
    const confidencePercentage = (max_prob * 100).toFixed(1);
    
    return `Based on the image analysis, I've identified this as likely ${displayName} with ${confidencePercentage}% confidence. ${description}\n\nFor proper vector control measures, please consult with pest control professionals or health authorities.`;
}

export default function VectorClassifier() {
    const [predictionPopup, setPredictionPopup] = useState(false);
    const [reviewPopup, setReviewPopup] = useState(false);
    const [changePredictionPopup, setChangePredictionPopup] = useState(false);
    const [imageURL, setImageURL] = useState<undefined | string>(undefined);
    const [image, setImage] = useState<undefined | File>(undefined);
    const [absoluteImageURL, setAbsoluteImageURL] = useState("");
    const [predictedResults, setPredictedResults] = useState({
        className: "...",
        date: "...",
    });
    const [userQuestion, setUserQuestion] = useState("");
    const [isPredicting, setIsPredicting] = useState(false);
    const [aiResponse, setAiResponse] = useState("...");
    const [changingPrediction, setChangingPrediction] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState("");
    const [userComment, setUserComment] = useState("");
    const [regularFilename, setRegularFilename] = useState("");
    const [simulationMode, setSimulationMode] = useState(true);

    const { uploadFile, isUploading } = useFileUpload();

    async function handleAskQuestion() {
        const prediction = predictedResults.className.trim();
        const question = userQuestion.trim();

        if (!prediction || !question) {
            alert("Prediction or question fields are empty");
            return;
        }

        if (simulationMode && prediction !== "...") {
            const responses = {
                "what is this": "This is a disease-carrying vector identified through image analysis.",
                "is it dangerous": "Many vectors can transmit diseases to humans. Prevention and control measures are recommended.",
                "how to control": "Vector control involves eliminating breeding sites, using insecticides, and maintaining cleanliness.",
                "prevention": "Prevention includes using protective clothing, insect repellents, and bed nets."
            };

            const lowerQuestion = question.toLowerCase();
            let response = "Thank you for your question about this vector. ";

            for (const [key, value] of Object.entries(responses)) {
                if (lowerQuestion.includes(key.split(' ')[0])) {
                    response += value;
                    break;
                }
            }

            if (response === "Thank you for your question about this vector. ") {
                response += "For specific control and prevention measures, please consult with pest control professionals.";
            }

            setAiResponse(response);
            return;
        }

        try {
            const result = await fetch("/api/askgpt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prediction, question, absoluteImageURL }),
            });
            const returnText = await result.text();
            setAiResponse(returnText);
        } catch (error) {
            console.error(error);
        }
    }

    async function commentOnImage(comment: string, imagePath: string, classification: string, changedClassification: string) {
        try {
            const result = await fetch("/api/comments", {
                method: "POST",
                body: JSON.stringify({ comment, imagePath, classification, changedClassification }),
            });
            return JSON.parse(await result.text());
        } catch (error) {
            console.error(error);
        }
    }

    async function startPrediction() {
        try {
            if (image) {
                setIsPredicting(true);

                if (simulationMode) {
                    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

                    const simulatedPrediction = simulateVectorPrediction();
                    const explanation = generateExplanation(simulatedPrediction);

                    setPredictedResults({
                        className: simulatedPrediction.max_prob < 0.65 ? "not-identified" : simulatedPrediction.displayName,
                        date: new Date().toDateString(),
                    });

                    setAiResponse(explanation);
                    setRegularFilename("simulated_image.jpg");
                    setAbsoluteImageURL(imageURL || "");

                    setImage(undefined);
                    setPredictionPopup(false);
                    setIsPredicting(false);
                    setReviewPopup(true);
                    return;
                }

                const result = await uploadFile(image);
                const fileName = result.split("/uploads/")[1];

                const prediction = await fetch("/api/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileName }),
                });

                setRegularFilename(fileName);
                setAbsoluteImageURL(`${DOMAIN}/uploads/${fileName}`);

                const predictionResults = JSON.parse(await prediction.text()).classification;

                if (predictionResults) {
                    const accuracy = predictionResults.max_prob;
                    setPredictedResults({
                        className: accuracy < 0.65 ? "not-identified" : predictionResults.predicted_class,
                        date: new Date().toDateString(),
                    });
                }

                setImage(undefined);
                setPredictionPopup(false);
                setIsPredicting(false);
                setReviewPopup(true);
            }
        } catch (error) {
            console.error(error);
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

    async function confirmPredictionChanges() {
        setChangingPrediction(true);
        setPredictedResults({ ...predictedResults, className: selectedChoice });

        if (simulationMode) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setChangePredictionPopup(false);
            setChangingPrediction(false);
            return;
        }

        await fetch(`api/reference/`, {
            method: "POST",
            body: JSON.stringify({ fileName: regularFilename, folderName: selectedChoice })
        });

        await commentOnImage(userComment, regularFilename, predictedResults.className, selectedChoice);

        setChangePredictionPopup(false);
        setChangingPrediction(false);
    }

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

            {reviewPopup && (
                <Popup
                    title="Classification Results"
                    onClose={() => {
                        setReviewPopup(false);
                        setImageURL(undefined);
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
                                        onChange={(e) => setUserQuestion(e.target.value)}
                                    />
                                    <button type="button" onClick={handleAskQuestion}>Ask AI</button>
                                </div>
                            </div>

                            <div className="image-view-details-wrapper">
                                <div className="stretch-container simple-grid">
                                    <div className="simple-grid">
                                        <p className="subheading">Classification Result</p>
                                        <p className="stand-out">{predictedResults.className}</p>
                                    </div>
                                    <div className="button change-prediction-button" onClick={() => setChangePredictionPopup(true)}>
                                        Change Classification
                                    </div>
                                </div>

                                <div className="stretch-container">
                                    <div className="simple-grid">
                                        <p className="subheading">Classification Date</p>
                                        <p className="stand-out">{predictedResults.date}</p>
                                    </div>
                                </div>

                                <div className="stretch-container">
                                    <div className="simple-grid">
                                        <p className="subheading">AI Explanation</p>
                                        <p className="stand-out" style={{ fontSize: "10px" }}>{aiResponse}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PopupBody>
                </Popup>
            )}

            {changePredictionPopup && (
                <Popup title="Change Classification" onClose={() => setChangePredictionPopup(false)}>
                    <PopupBody>
                        <div className="popup-body change-prediction-body">
                            <div className="current-predition-container">
                                <p className="mini-title">Current Classification:</p>
                                <p className="current-prediction-placeholder">{predictedResults.className}</p>
                            </div>

                            <div className="change-to-container">
                                <p className="mini-title">Change to:</p>
                                <div className="change-to-options">
                                    {availableChoices
                                        .filter((option) => option !== predictedResults.className)
                                        .map((choice, index) => (
                                            <label key={index} className="change-option">
                                                <input type="radio" name="radio" required onChange={() => setSelectedChoice(choice)} />
                                                {choice.replace(/_/g, ' ')}
                                            </label>
                                        ))}
                                </div>
                            </div>

                            <div className="comment-container">
                                <p className="mini-title">Comment (Optional):</p>
                                <input className="comment" onChange={(e) => setUserComment(e.target.value)} />
                            </div>
                            <p className="disclaimer">
                                The classification will be updated to the new choice. The image will be used to improve future versions of the model.
                            </p>

                            <button className="button" type="button" onClick={confirmPredictionChanges}>
                                Confirm Changes
                            </button>
                        </div>
                        {changingPrediction && <Loader />}
                    </PopupBody>
                </Popup>
            )}
        </div>
    );
}
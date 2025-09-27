"use client";

import React, { ChangeEvent, useState } from "react";
import { Popup, PopupBody, PopupFooter } from "@/app/components/Popup";
import "@/app/styles/main.css";
import "@/app/styles/reviewpopup.css";
import "@/app/styles/changePrediction.css";
import bedBug from "@/app/diseaseImages/bedBug.jpg";
import headLice from "@/app/diseaseImages/Head-Lice.jpg";
import Image from "next/image";

import useFileUpload from "@/app/hooks/useFileUpload";
import Loader from "@/app/components/Loader/Loader";

const diseaseDisplayStyles = `
.disease-showcase {
  margin-top: 40px;
  padding: 30px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 2px solid #dee2e6;
}

.disease-showcase h3 {
  text-align: center;
  color: #495057;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.disease-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.disease-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid #6c757d;
}

.disease-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.disease-card:nth-child(1) { border-left-color: #dc3545; }
.disease-card:nth-child(2) { border-left-color: #fd7e14; }
.disease-card:nth-child(3) { border-left-color: #ffc107; }
.disease-card:nth-child(4) { border-left-color: #28a745; }
.disease-card:nth-child(5) { border-left-color: #17a2b8; }
.disease-card:nth-child(6) { border-left-color: #6f42c1; }

.disease-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: #f8f9fa;
}

.disease-content {
  padding: 20px;
}

.disease-name {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .disease-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .disease-showcase {
    padding: 20px 15px;
  }
  
  .disease-content {
    padding: 15px;
  }
  
  .disease-image {
    height: 140px;
  }
}
`;

const DOMAIN = "http://mpoxapp.aiiot.center"; // This is to retrieve the image for GPT

const availableChoices = [
    "chickenpox",
    "acne",
    "monkeypox",
    "non-skin",
    "normal",
    "not-identified",
];

// Simulation data based on the disease classification table
const diseaseSimulationData = {
    "Cimex_Lectularius": {
        displayName: "Bed Bug Bites",
        precision: 0.95,
        recall: 0.96,
        f1Score: 0.96,
        description: "Small, red, itchy bumps typically appearing in clusters or lines on exposed skin areas. These bites are commonly found on the face, neck, arms, and hands.",
        imageUrl: "/assets/bedBug.jpg"
    },
    "Pediculus_humanus_capitis": {
        displayName: "Head Lice",
        precision: 0.94,
        recall: 0.95,
        f1Score: 0.95,
        description: "Tiny insects that infest the scalp and hair. Signs include intense itching, small red bumps on the scalp, neck, and shoulders, and the presence of lice eggs (nits) attached to hair shafts.",
        imageUrl: "/assets/Head-Lice.jpg"
    },
    "Culex_sp": {
        displayName: "Mosquito Bites",
        precision: 0.94,
        recall: 0.95,
        f1Score: 0.95,
        description: "Red, swollen, itchy bumps that appear shortly after mosquito bites. These welts are usually small and round, but can vary in size and may appear in groups.",
        imageUrl: "/assets/mosquito.jpg"
    },
    "Ixodes_ricinus": {
        displayName: "Tick Bite",
        precision: 0.94,
        recall: 0.96,
        f1Score: 0.95,
        description: "A tick bite typically appears as a small red bump, similar to a mosquito bite. If infected with Lyme disease, it may develop into a characteristic 'bull's-eye' rash with expanding rings.",
        imageUrl: "/assets/tick.jpg"
    },
    "Ctenocephalides_felis": {
        displayName: "Flea Bites",
        precision: 0.97,
        recall: 0.94,
        f1Score: 0.95,
        description: "Small, red, extremely itchy bumps that often appear in clusters or lines, typically on the lower legs and feet. The bites have a distinctive red halo around a central puncture point.",
        imageUrl: "/assets/flea.jpg"
    },
    "Aedes": {
        displayName: "Aedes Mosquito Bites",
        precision: 0.96,
        recall: 0.93,
        f1Score: 0.94,
        description: "Red, swollen bumps that can be quite large and intensely itchy. Aedes mosquitoes are aggressive day-time biters and their bites may cause more severe reactions than common house mosquitoes.",
        imageUrl: "/assets/aedes.jpg"
    }
};

// Function to simulate disease prediction
function simulateDiseasePrediction() {
    const diseases = Object.keys(diseaseSimulationData) as (keyof typeof diseaseSimulationData)[];
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const diseaseData = diseaseSimulationData[randomDisease];
    
    // Simulate some variance in confidence
    const baseConfidence = diseaseData.precision;
    const variance = (Math.random() - 0.5) * 0.1; // ±0.05 variance
    const confidence = Math.max(0.65, Math.min(0.99, baseConfidence + variance));
    
    return {
        predicted_class: randomDisease,
        max_prob: confidence,
        displayName: diseaseData.displayName,
        description: diseaseData.description
    };
}

// Function to generate human-friendly explanation
function generateHumanExplanation(prediction: any) {
    const { displayName, description, max_prob } = prediction;
    const confidencePercentage = (max_prob * 100).toFixed(1);
    
    const explanations = [
        `Based on the analysis of your skin image, I've identified this as likely ${displayName} with ${confidencePercentage}% confidence. ${description}`,
        `The image shows characteristics consistent with ${displayName} (${confidencePercentage}% certainty). ${description}`,
        `My analysis suggests this appears to be ${displayName} with ${confidencePercentage}% confidence. ${description}`,
    ];
    
    return explanations[Math.floor(Math.random() * explanations.length)] + 
           "\n\nPlease consult with a healthcare professional for proper diagnosis and treatment recommendations.";
}

export default function Dashboard() {
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
    const [gptResult, setGPTResult] = useState("...");

    const [changingPrediction, setChangingPrediction] = useState(false);

    const [selectedChoice, setSelectedChoice] = useState("");
    const [userComment, setUserComment] = useState("");
    const [regularFilename, setRegularFilename] = useState("");

    // Add simulation mode state
    const [simulationMode, setSimulationMode] = useState(true);

    const { uploadFile, isUploading } = useFileUpload();

    async function handleAskQuestion() {
        const prediction = predictedResults.className.trim();
        const question = userQuestion.trim();

        if (!prediction || !question) {
            // return new Error("Requirements not satisfied"); //TODO: show toast
            alert("prediction or quesion fields are empty");
            return;
        }

        // In simulation mode, generate contextual responses
        if (simulationMode && prediction !== "...") {
            const responses = {
                "what is this": "This appears to be an insect bite or skin irritation. The characteristics visible in the image suggest it could be from common household pests.",
                "is it serious": "Most insect bites and minor skin conditions are not serious and heal on their own. However, if you experience severe symptoms, spreading redness, or signs of infection, please consult a healthcare provider.",
                "how to treat": "For most insect bites, you can apply a cold compress to reduce swelling, use anti-itch cream or calamine lotion, and avoid scratching. If symptoms persist or worsen, seek medical advice.",
                "should i see a doctor": "You should see a doctor if you experience severe allergic reactions, signs of infection (increased redness, warmth, pus), fever, or if the condition doesn't improve within a few days."
            };

            const lowerQuestion = question.toLowerCase();
            let response = "I understand your concern about this skin condition. ";

            // Find the most relevant response
            for (const [key, value] of Object.entries(responses)) {
                if (lowerQuestion.includes(key.split(' ')[0]) || lowerQuestion.includes(key)) {
                    response += value;
                    break;
                }
            }

            if (response === "I understand your concern about this skin condition. ") {
                response += "Based on the image analysis, this appears to be a common skin condition. For specific medical advice, please consult with a healthcare professional who can provide personalized recommendations.";
            }

            setGPTResult(response);
            return;
        }

        const result = await fetch("/api/askgpt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prediction,
                question,
                absoluteImageURL,
            }),
        });

        const returnText = await result.text();
        setGPTResult(returnText);
    }

    // async function getComments() {
    //     try {
    //         const result = await fetch("/api/comments", {
    //             method: "GET",
    //         });

    //         return JSON.parse(await result.text());
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }

    async function commentOnImage(
        comment: string,
        imagePath: string,
        classification: string,
        changedClassification: string
    ) {
        try {
            const result = await fetch("/api/comments", {
                method: "POST",
                body: JSON.stringify({
                    comment,
                    imagePath,
                    classification,
                    changedClassification,
                }),
            });

            return JSON.parse(await result.text());
        } catch (error) {
            console.error(error);
        }
    }

    // useEffect(() => {
    //     // (async () => {
    //     //     const results = await getComments();
    //     //     console.log("results: ", results);
    //     // })();
    // }, []);

    async function startPrediction() {
        try {
            if (image) {
                setIsPredicting(true);

                // In simulation mode, use simulated data
                if (simulationMode) {
                    // Simulate processing time
                    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

                    const simulatedPrediction = simulateDiseasePrediction();
                    const humanExplanation = generateHumanExplanation(simulatedPrediction);

                    setPredictedResults({
                        className: simulatedPrediction.max_prob < 0.65 
                            ? "not-identified" 
                            : simulatedPrediction.displayName,
                        date: new Date().toDateString(),
                    });

                    setGPTResult(humanExplanation);
                    setRegularFilename("simulated_image.jpg");
                    setAbsoluteImageURL(imageURL || "");

                    setImage(undefined);
                    setPredictionPopup(false);
                    setIsPredicting(false);
                    setReviewPopup(true);
                    return;
                }

                // Original prediction logic for non-simulation mode
                const result = await uploadFile(image);
                console.log("upload result: ", result);

                const fileName = result.split("/uploads/")[1];

                const prediction = await fetch("/api/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ fileName }),
                });

                setRegularFilename(fileName);
                setAbsoluteImageURL(`${DOMAIN}/uploads/${fileName}`);

                const predictionResults = JSON.parse(
                    await prediction.text()
                ).classification;
                console.log("predictionResults: ", predictionResults);

                if (predictionResults) {
                    const accuracy = predictionResults.max_prob;
                    setPredictedResults({
                        className:
                            accuracy < 0.65
                                ? "not-identified"
                                : predictionResults.predicted_class,
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
                console.log("url", url);
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

        console.log("changedClassification: ", selectedChoice);
        console.log("imagePath: ", regularFilename);
        console.log("comment: ", userComment);
        console.log("classification: ", predictedResults.className);

        setPredictedResults({ ...predictedResults, className: selectedChoice });

        // In simulation mode, just simulate the process
        if (simulationMode) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setChangePredictionPopup(false);
            setChangingPrediction(false);
            return;
        }

        // save image into correct folder
        const changeResults = await fetch(`api/reference/`, {
            method: "POST",
            body: JSON.stringify({
                fileName: regularFilename,
                folderName: selectedChoice
            })
        });

        console.log("change results: ", await changeResults.text())

        const imageComment = await commentOnImage(
            userComment,
            regularFilename,
            predictedResults.className,
            selectedChoice
        );

        console.log("comment result", imageComment);

        //close popup
        setChangePredictionPopup(false);
        setChangingPrediction(false);
    }

    return (
        <>
            <div className="predict-button-container">
                {/* Add simulation toggle */}
                <div style={{ marginBottom: "10px", textAlign: "center" }}>
                    <label style={{ fontSize: "14px", color: "#666" }}>
                        <input
                            type="checkbox"
                            checked={simulationMode}
                            onChange={(e) => setSimulationMode(e.target.checked)}
                            style={{ marginRight: "8px" }}
                        />
                        Simulation Mode
                    </label>
                </div>
                
                <div
                    className="button"
                    onClick={() => setPredictionPopup(true)}
                >
                    Perform Skin Disease Prediction
                </div>
            </div>

            {predictionPopup && (
                <Popup
                    title="Predict Skin Disease"
                    onClose={() => {
                        setImage(undefined);
                        setImageURL(undefined);
                        setPredictionPopup(false);
                    }}
                >
                    <PopupBody size={{ height: "auto", width: "540px" }}>
                        <label
                            htmlFor="image-predict"
                            className="image-upload-wrapper"
                        >
                            {imageURL == undefined ? (
                                <div className="select-image">
                                    click here to select or take an image to
                                    predict
                                    {simulationMode && <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
                                        (Will simulate realistic disease predictions)
                                    </div>}
                                </div>
                            ) : (
                                <img
                                    src={imageURL}
                                    className="image-predict-chosen-preview"
                                    alt=""
                                />
                            )}

                            <input
                                style={{ display: "none" }}
                                type="file"
                                id="image-predict"
                                accept="image/*"
                                onChange={(event) =>
                                    handlePredictingImageChange(event)
                                }
                            />
                        </label>

                        {isUploading || (isPredicting && <Loader />)}
                    </PopupBody>

                    <PopupFooter>
                        <div className="button" onClick={startPrediction}>
                            start prediction
                        </div>
                    </PopupFooter>
                </Popup>
            )}

            {reviewPopup && (
                <Popup
                    title="Prediction Results"
                    onClose={() => {
                        setReviewPopup(false);
                        setImageURL(undefined);
                    }}
                >
                    <PopupBody size={{ width: "70vw", height: "auto" }}>
                        <div className="prediction-view-body">
                            <div className="image-view-wrapper">
                                {!imageURL && <Loader />}

                                {imageURL && (
                                    <img
                                        className="image-review-view"
                                        alt=""
                                        src={imageURL}
                                    />
                                )}

                                <div className="gpt-ask-container">
                                    <input
                                        type="text"
                                        placeholder="Ask about the prediction..."
                                        onChange={(e) =>
                                            setUserQuestion(e.target.value)
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAskQuestion}
                                    >
                                        Ask AI
                                    </button>
                                </div>
                            </div>

                            <div className="image-view-details-wrapper">
                                <div className="stretch-container simple-grid">
                                    <div className="simple-grid">
                                        <p className="subheading">
                                            Prediction Result
                                        </p>
                                        <p className="stand-out">
                                            {predictedResults.className}
                                        </p>
                                    </div>

                                    <div
                                        className="button change-prediction-button"
                                        onClick={() =>
                                            setChangePredictionPopup(true)
                                        }
                                    >
                                        Change Prediction
                                    </div>
                                </div>

                                <div className="stretch-container">
                                    <div className="simple-grid">
                                        <p className="subheading">
                                            Prediction Date
                                        </p>
                                        <p className="stand-out">
                                            {predictedResults.date}
                                        </p>
                                    </div>
                                </div>

                                <div className="stretch-container">
                                    <div className="simple-grid">
                                        <p className="subheading">
                                            Prediction Explanation
                                        </p>
                                        <p
                                            className="stand-out"
                                            style={{ fontSize: "10px" }}
                                        >
                                            {gptResult}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* <script src="chatgpt-prediction.js"></script> */}
                    </PopupBody>
                </Popup>
            )}

            {changePredictionPopup && (
                <Popup
                    title="Change Prediction"
                    onClose={() => setChangePredictionPopup(false)}
                >
                    <PopupBody>
                        <div className="popup-body change-prediction-body">
                            <div className="current-predition-container">
                                <p className="mini-title">
                                    Current Predicition:
                                </p>
                                <p className="current-prediction-placeholder">
                                    {predictedResults.className}
                                </p>
                            </div>

                            <div className="change-to-container">
                                <p className="mini-title">Change to:</p>
                                <div className="change-to-options">
                                    {availableChoices
                                        .filter(
                                            (option) =>
                                                option !=
                                                predictedResults.className
                                        )
                                        .map((choice, index) => (
                                            <label
                                                key={index}
                                                className="change-option"
                                            >
                                                <input
                                                    type="radio"
                                                    name="radio"
                                                    required
                                                    onChange={() =>
                                                        setSelectedChoice(
                                                            choice
                                                        )
                                                    }
                                                />
                                                {choice}
                                            </label>
                                        ))}
                                </div>
                            </div>

                            <div className="comment-container">
                                <p className="mini-title">
                                    Comment (Optional):
                                </p>
                                <input
                                    className="comment"
                                    onChange={(e) =>
                                        setUserComment(e.target.value)
                                    }
                                />
                            </div>
                            <p className="disclaimer">
                                The prediction value will be changed to the new
                                choice. The image will be used to improve future
                                versions of the model.
                            </p>

                            <button
                                className="button"
                                type="button"
                                onClick={confirmPredictionChanges}
                            >
                                Confirm Changes
                            </button>
                        </div>

                        {changingPrediction && <Loader />}
                    </PopupBody>
                </Popup>
            )}

        {simulationMode && (
          <div className="disease-showcase">
            <style jsx>{diseaseDisplayStyles}</style>
            <h3>Available Disease Classifications</h3>
            <div className="disease-grid">
              {Object.entries(diseaseSimulationData).map(([key, disease]) => (
                <div key={key} className="disease-card">
                  <img 
                    src={disease.imageUrl} 
                    alt={disease.displayName}
                    className="disease-image"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236c757d' font-family='Arial' font-size='14'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="disease-content">
                    <div className="disease-name">{disease.displayName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>

        // <?php include "components/changePrediction.php" ?>
    );
}
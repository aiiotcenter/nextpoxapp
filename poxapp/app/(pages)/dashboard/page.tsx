"use client";

import React, { ChangeEvent, useState } from "react";
import { Popup, PopupBody, PopupFooter } from "@/app/components/Popup";
import "@/app/styles/main.css";
import "@/app/styles/reviewpopup.css";

import useFileUpload from "@/app/hooks/useFileUpload";
import Loader from "@/app/components/Loader/Loader";

const DOMAIN = "https://mpoxapp.aiiot.center"; // This is to retrieve the image for GPT

export default function Dashboard() {
    const [predictionPopup, setPredictionPopup] = useState(false);
    const [reviewPopup, setReviewPopup] = useState(false);
    const [, setChangePredictionPopup] = useState(false);
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

    const { uploadFile, isUploading } = useFileUpload();

    async function handleAskQuestion() {
        const prediction = predictedResults.className.trim();
        const question = userQuestion.trim();

        if (!prediction || !question) {
            // return new Error("Requirements not satisfied"); //TODO: show toast
            alert("prediction or quesion fields are empty");
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

    async function startPrediction() {
        try {
            if (image) {
                // upload file, get new filename
                const result = await uploadFile(image);
                console.log("upload result: ", result);

                const fileName = result.split("/uploads/")[1];

                setIsPredicting(true);

                const prediction = await fetch("/api/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ fileName }),
                });

                setAbsoluteImageURL(`${DOMAIN}/uploads/${fileName}`);

                const predictionResults = JSON.parse(
                    await prediction.text()
                ).classification;
                console.log("predictionResults: ", predictionResults);

                if (predictionResults) {
                    setPredictedResults({
                        className: predictionResults.predicted_class,
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

    return (
        <>
            <div className="predict-button-container">
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
                    <PopupBody size={{ height: "auto", width: "520px" }}>
                        <label
                            htmlFor="image-predict"
                            className="image-upload-wrapper"
                        >
                            {imageURL == undefined ? (
                                <div className="select-image">
                                    click here to select or take an image to
                                    predict
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
        </>

        // <?php include "components/changePrediction.php" ?>
    );
}

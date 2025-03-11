"use client";

import React, { ChangeEvent, useState } from "react";
import { Popup, PopupBody, PopupFooter } from "@/app/components/Popup";
import "@/app/styles/main.css";
import "@/app/styles/reviewpopup.css";
import "@/app/styles/changePrediction.css";

import useFileUpload from "@/app/hooks/useFileUpload";
import Loader from "@/app/components/Loader/Loader";

const DOMAIN = "http://mpoxapp.aiiot.center"; // This is to retrieve the image for GPT

const availableChoices = [
    "chickenpox",
    "acne",
    "monkeypox",
    "non-skin",
    "normal",
    "not-identified",
];

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
        </>

        // <?php include "components/changePrediction.php" ?>
    );
}

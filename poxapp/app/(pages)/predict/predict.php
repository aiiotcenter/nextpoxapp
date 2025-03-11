<?php

    session_start();
    $id = isset($_SESSION['id']);
    $username = isset($_SESSION['username']);

    if(!$username){ header('location:index.html'); }

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>

    <?php include "include/userDynamicImports.php" ?>
</head>
<body>

    <?php include "components/header.php" ?>
    <?php include "components/menu.php" ?>

    <div class="predict-main-container main-container normal-margin">

        <div class="mini-section-header">
            <h2>Predict</h2>

            <div class="arrow-link">
                <a href="pastpredictions.php">View All Predictions</a>
                <p>→</p>
            </div>
        </div>

        <div class="min-max-wrapper">
            <div class="instructions">
                <h3>Instructions</h3>

                <ol>
                    <li>Click the <highlight>Perform Skin Disease Prediction</highlight> button</li>
                    <li>Confirm the model you'd like to predict with. You may change models anytime you are predicting. Model settings will be saved after reselection.</li>
                    <li>Click to select or take an <highlight>image</highlight> from your device.</li>
                    <li>Click the <highlight>start prediction</highlight>button to start the model and predict the image.</li>
                    <li>Wait a couple of seconds for the model to predict. The popup will close automatically and open a new result popup.</li>
                </ol>
            </div>

            <div class="stretchxy-container">
                <div class="predict-button-container">
                    <div class="button" onclick="handlePredictContainerView()">Perform Skin Disease Prediction</div>
                </div>
            </div>
        </div>

    </div>

    <?php include "components/predictionOverlay.php" ?>
    <?php include "components/predictionViewOverlay.php" ?>
    <?php include "components/changePrediction.php" ?>

</body>
</html>
<div class="overlay change-prediction-overlay">
    <div class="popup change-prediction-popup">

        <div class="popup-header">
            <h2 class="popup-title">
                Change Prediction
            </h2>
            <div class="close-button" onclick="
                closePopup('.change-prediction-overlay');
                ">
                <img src="../assets/icons/close.png" alt="">
            </div>
        </div>

        <form class="popup-body change-prediction-body">

            <div class="current-predition-container">
                <p class="mini-title">Current Predicition:</p>
                <p class="current-prediction-placeholder">Chicken Pox</p>
            </div>

            <div class="change-to-container">
                <p class="mini-title">Change to:</p>
                <div class="change-to-options">
                    <label class="change-option">
                        <input type="radio" name="radio" required>
                        Measles
                    </label>
                    <label class="change-option">
                        <input type="radio" name="radio">
                        Acne
                    </label>

                    <label class="change-option">
                        <input type="radio" name="radio">
                        ChickenPox
                    </label>
                </div>
            </div>

            <div class="comment-container">
                <p class="mini-title">Comment (Optional):</p>
                <div class="comment" placeholder="Optional Comment" contenteditable="true"></div>
            </div>
            <p class="disclaimer">The prediction value will be changed to the new choice. The image will be used to
                improve the model.</p>

            <button class="button" type="submit" onclick="confirmPredictionChanges(event)">Confirm Changes</button>

        </form>

        <div class="loader-view change-prediction-loader">
            <div>
                <div class="sk-grid">
                    <div class="sk-grid-cube"></div>
                    <div class="sk-grid-cube"></div>
                    <div class="sk-grid-cube"></div>
                    <div class="sk-grid-cube"></div>
                    <div class="sk-grid-cube"></div>
                    <div class="sk-grid-cube"></div>
                    <div class="sk-grid-cube"></div>
                    <div class="sk-grid-cube"></div>
                    <div class="sk-grid-cube"></div>
                </div>
            </div>
        </div>
    </div>
</div>
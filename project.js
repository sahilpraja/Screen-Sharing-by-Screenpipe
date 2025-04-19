const videoElem = document.getElementById("video");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");
const recordElem = document.getElementById("record");
const uploadElem = document.getElementById("upload");
const errorElem = document.getElementById("error");

const displayMediaOptions = {
    video: { cursor: "always" },
    audio: false
};

let mediaRecorder;
let recordedChunks = [];

// Function to display error messages
function showError(message) {
    errorElem.textContent = message;
    errorElem.style.display = "block";
}

// Function to clear error messages
function clearError() {
    errorElem.textContent = "";
    errorElem.style.display = "none";
}

// Start screen sharing
startElem.addEventListener("click", async () => {
    try {
        clearError();
        startElem.disabled = true;
        stopElem.disabled = false;
        recordElem.disabled = false;

        const mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        videoElem.srcObject = mediaStream;

        // Handle when the user stops sharing from the browser UI
        mediaStream.getVideoTracks()[0].addEventListener("ended", () => {
            stopScreenSharing();
        });
    } catch (err) {
        console.error("Error: ", err);
        showError("Failed to start screen sharing. Please check your browser permissions.");
        startElem.disabled = false;
        stopElem.disabled = true;
        recordElem.disabled = true;
    }
});

// Stop screen sharing
stopElem.addEventListener("click", () => {
    stopScreenSharing();
});

// Start recording
recordElem.addEventListener("click", () => {
    const mediaStream = videoElem.srcObject;
    if (!mediaStream) {
        showError("No media stream available for recording.");
        return;
    }

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream);

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");

        // Enable upload button
        uploadElem.disabled = false;

        // Upload recording to the server
        uploadElem.addEventListener("click", async () => {
            try {
                const response = await fetch("/upload", {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    showError("Recording uploaded successfully!");
                } else {
                    showError("Failed to upload recording.");
                }
            } catch (err) {
                console.error("Upload error: ", err);
                showError("An error occurred while uploading the recording.");
            }
        });
    };

    mediaRecorder.start();
    recordElem.disabled = true;
    showError("Recording started...");
});

// Stop screen sharing and recording
function stopScreenSharing() {
    const tracks = videoElem.srcObject?.getTracks();
    if (tracks) {
        tracks.forEach(track => track.stop());
    }
    videoElem.srcObject = null;

    startElem.disabled = false;
    stopElem.disabled = true;
    recordElem.disabled = true;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    clearError();
}
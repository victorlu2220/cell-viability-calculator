function uploadImage() {
    cropped_image_exist = false;
    document.getElementById('fileInput').click();
}

function displayImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = new Image();
            imgElement.onload = function() {
                const originalCanvas = document.getElementById('originalCanvas');
                const ctx = originalCanvas.getContext('2d');
                originalCanvas.width = imgElement.width;
                originalCanvas.height = imgElement.height;
                ctx.drawImage(imgElement, 0, 0);
            };
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function cropImage() {
    cropped_image_exist = true; 
    const originalCanvas = document.getElementById('originalCanvas');
    const originalCtx = originalCanvas.getContext('2d');
    const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    const data = imageData.data;

    const redMinCrop = parseInt(document.getElementById('redMinCrop').value);
    const blueMinCrop = parseInt(document.getElementById('blueMinCrop').value);

    let start_row = null;
    let stop_row = null;
    let row_num = 0;

    for (let row = 0; row < originalCanvas.height; row++) {
        let r_current_row = [];
        let b_current_row = [];
        for (let column = 0; column < originalCanvas.width; column++) {
            const index = (row * originalCanvas.width + column) * 4;
            const r = data[index];
            const b = data[index + 2];
            r_current_row.push(r);
            b_current_row.push(b);
        }
        const mean_r = r_current_row.reduce((acc, val) => acc + val, 0) / r_current_row.length;
        const mean_b = b_current_row.reduce((acc, val) => acc + val, 0) / b_current_row.length;

        if (mean_b <= blueMinCrop && start_row === null) {
            start_row = row_num;
        }
        if (mean_r <= redMinCrop && start_row !== null) {
            stop_row = row_num;
            break;
        }
        row_num++;
    }

    if (stop_row !== null && start_row !== null) {
        const height = stop_row - start_row;
        const croppedCanvas = document.getElementById('croppedCanvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        croppedCanvas.width = originalCanvas.width;
        croppedCanvas.height = height;
        croppedCtx.putImageData(originalCtx.getImageData(0, start_row, originalCanvas.width, height), 0, 0);
    } else {
        const errorMessageElement = document.getElementById('error-message');
        if (errorMessageElement) {
            errorMessageElement.innerText = "Invalid crop area. Please adjust the parameters and try again.";
            setTimeout(() => {
                errorMessageElement.innerText = "";
            }, 5000);
        }
        console.error("Invalid crop area");
    }
}

function analyzeImage() {
    const croppedCanvas = document.getElementById('croppedCanvas');
    const originalCanvas = document.getElementById('originalCanvas');
    let canvasToAnalyze;
    let ctxToAnalyze;

    // Check if croppedCanvas contains an image
    if (cropped_image_exist === true) {
        canvasToAnalyze = croppedCanvas;
        ctxToAnalyze = croppedCanvas.getContext('2d');
    } else {
        canvasToAnalyze = originalCanvas;
        ctxToAnalyze = originalCanvas.getContext('2d');
    }

    const processedCanvas = document.getElementById('processedCanvas');
    const processedCtx = processedCanvas.getContext('2d');

    processedCanvas.width = canvasToAnalyze.width;
    processedCanvas.height = canvasToAnalyze.height;

    const imageData = ctxToAnalyze.getImageData(0, 0, canvasToAnalyze.width, canvasToAnalyze.height);
    const data = imageData.data;
    const blueMin = parseInt(document.getElementById('blueMinCal').value);
    const redMin = parseInt(document.getElementById('redMinCal').value);

    let dead_count = 0;
    let overall_count = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (b >= blueMin) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            continue;
        } else if (r >= redMin) {
            data[i] = 255;
            data[i + 1] = 0;
            data[i + 2] = 0;
            dead_count++;
        }
        overall_count++;
    }

    processedCtx.putImageData(imageData, 0, 0);
    const viability = 1 - dead_count / overall_count;
    document.getElementById('result').innerText = `The overall cell viability is ${viability.toFixed(2)}`;
}

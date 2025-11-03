// Load dataset info on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDatasetInfo();
    checkModelStatus();
});

// Capture form submission
document.getElementById('captureForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('personName').value.trim();
    const numImages = document.getElementById('numImages').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!name) {
        showStatus('Please enter a person name', 'error', 'trainingStatus');
        return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Capturing...';

    fetch('/capture_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name,
            num_images: parseInt(numImages)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatus(data.message, 'success', 'trainingStatus');
            document.getElementById('personName').value = '';
            loadDatasetInfo();
        } else {
            showStatus('Error: ' + data.message, 'error', 'trainingStatus');
        }
    })
    .catch(error => {
        showStatus('Error capturing data: ' + error, 'error', 'trainingStatus');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Capture Data';
    });
});

// Refresh dataset button
document.getElementById('refreshDataset').addEventListener('click', function() {
    loadDatasetInfo();
});

// Train model button
document.getElementById('trainBtn').addEventListener('click', function() {
    const trainBtn = this;
    trainBtn.disabled = true;
    trainBtn.textContent = 'Training...';

    showStatus('Training model, please wait...', 'info', 'trainingStatus');

    fetch('/train_model', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatus(`Success! ${data.message}`, 'success', 'trainingStatus');
            checkModelStatus();
        } else {
            showStatus('Error: ' + data.message, 'error', 'trainingStatus');
        }
    })
    .catch(error => {
        showStatus('Error training model: ' + error, 'error', 'trainingStatus');
    })
    .finally(() => {
        trainBtn.disabled = false;
        trainBtn.textContent = 'Train Model';
    });
});

// Load dataset information
function loadDatasetInfo() {
    const datasetInfoDiv = document.getElementById('datasetInfo');
    datasetInfoDiv.innerHTML = '<p class="loading">Loading...</p>';

    fetch('/get_dataset_info')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.data.length === 0) {
                datasetInfoDiv.innerHTML = '<p class="loading">No data collected yet</p>';
            } else {
                let html = '';
                data.data.forEach(person => {
                    html += `
                        <div class="dataset-item">
                            <div class="person-info">
                                <div class="person-name">${person.name}</div>
                                <div class="person-images">${person.images} images</div>
                            </div>
                            <button class="delete-btn" onclick="deletePerson('${person.name}')">Delete</button>
                        </div>
                    `;
                });
                datasetInfoDiv.innerHTML = html;
            }
        } else {
            datasetInfoDiv.innerHTML = '<p class="loading">Error loading dataset</p>';
        }
    })
    .catch(error => {
        datasetInfoDiv.innerHTML = '<p class="loading">Error: ' + error + '</p>';
    });
}

// Delete person
function deletePerson(name) {
    if (!confirm(`Are you sure you want to delete all data for ${name}?`)) {
        return;
    }

    fetch('/delete_person', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatus(data.message, 'success', 'trainingStatus');
            loadDatasetInfo();
        } else {
            showStatus('Error: ' + data.message, 'error', 'trainingStatus');
        }
    })
    .catch(error => {
        showStatus('Error deleting person: ' + error, 'error', 'trainingStatus');
    });
}

// Check model status
function checkModelStatus() {
    fetch('/check_model')
    .then(response => response.json())
    .then(data => {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        if (data.model_exists) {
            indicator.className = 'status-indicator active';
            statusText.textContent = 'Model trained and ready for recognition';
        } else {
            indicator.className = 'status-indicator inactive';
            statusText.textContent = 'No model trained yet';
        }
    })
    .catch(error => {
        console.error('Error checking model status:', error);
    });
}

// Show status message
function showStatus(message, type, elementId) {
    const statusDiv = document.getElementById(elementId);
    statusDiv.className = 'status-message show ' + type;
    statusDiv.textContent = message;

    setTimeout(() => {
        statusDiv.classList.remove('show');
    }, 5000);
}

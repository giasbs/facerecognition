// State management
let captureCameraActive = false;
let recognitionCameraActive = false;

// Load dataset info and check model status on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDatasetInfo();
    checkModelStatus();
    initializeTabs();
    initializeCameraToggles();
    initializeFormInteractions();
});

// Initialize tab switching
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // Stop cameras when switching tabs
            if (targetTab !== 'capture' && captureCameraActive) {
                toggleCaptureCamera();
            }
            if (targetTab !== 'recognize' && recognitionCameraActive) {
                toggleRecognitionCamera();
            }

            // Update stats when switching to train tab
            if (targetTab === 'train') {
                updateTrainingStats();
            }
        });
    });
}

// Initialize camera toggle buttons
function initializeCameraToggles() {
    const captureCameraBtn = document.getElementById('toggleCaptureCamera');
    const recognitionCameraBtn = document.getElementById('toggleRecognitionCamera');

    captureCameraBtn.addEventListener('click', toggleCaptureCamera);
    recognitionCameraBtn.addEventListener('click', toggleRecognitionCamera);
}

// Toggle capture camera
function toggleCaptureCamera() {
    const cameraSection = document.getElementById('captureCameraSection');
    const cameraBtn = document.getElementById('toggleCaptureCamera');
    const videoFeed = document.getElementById('videoFeed');

    captureCameraActive = !captureCameraActive;

    if (captureCameraActive) {
        cameraSection.style.display = 'block';
        videoFeed.src = '/video_feed?' + new Date().getTime();
        cameraBtn.classList.add('active');
        cameraBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
            Stop Camera
        `;
        animateElement(cameraSection);
    } else {
        cameraSection.style.display = 'none';
        videoFeed.src = '';
        cameraBtn.classList.remove('active');
        cameraBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
            </svg>
            Start Camera
        `;
    }
}

// Toggle recognition camera
function toggleRecognitionCamera() {
    const cameraSection = document.getElementById('recognitionCameraSection');
    const cameraBtn = document.getElementById('toggleRecognitionCamera');
    const videoFeed = document.getElementById('recognitionFeed');

    recognitionCameraActive = !recognitionCameraActive;

    if (recognitionCameraActive) {
        cameraSection.style.display = 'block';
        videoFeed.src = '/recognition_feed?' + new Date().getTime();
        cameraBtn.classList.add('active');
        cameraBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
            Stop Recognition
        `;
        animateElement(cameraSection);
    } else {
        cameraSection.style.display = 'none';
        videoFeed.src = '';
        cameraBtn.classList.remove('active');
        cameraBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
            </svg>
            Start Recognition
        `;
    }
}

// Initialize form interactions
function initializeFormInteractions() {
    const numImagesInput = document.getElementById('numImages');
    const currentValue = document.querySelector('.current-value');

    // Update current value display
    numImagesInput.addEventListener('input', function() {
        currentValue.textContent = this.value;
    });
}

// Animate element appearance
function animateElement(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';

    setTimeout(() => {
        element.style.transition = 'all 0.5s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }, 10);
}

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

    if (!captureCameraActive) {
        showStatus('Please start the camera before capturing', 'error', 'trainingStatus');
        return;
    }

    // Disable button and update UI
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
        </svg>
        Capturing...
    `;

    showStatus(`Capturing ${numImages} images for ${name}...`, 'info', 'trainingStatus');

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

            // Celebrate success with animation
            celebrateSuccess();
        } else {
            showStatus('Error: ' + data.message, 'error', 'trainingStatus');
        }
    })
    .catch(error => {
        showStatus('Error capturing data: ' + error, 'error', 'trainingStatus');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
            Start Capturing
        `;
    });
});

// Refresh dataset button
document.getElementById('refreshDataset').addEventListener('click', function() {
    this.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        this.style.transform = '';
    }, 500);
    loadDatasetInfo();
});

// Train model button
document.getElementById('trainBtn').addEventListener('click', function() {
    const trainBtn = this;
    trainBtn.disabled = true;
    trainBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
        </svg>
        Training...
    `;

    showStatus('Training model, please wait... This may take a few moments.', 'info', 'trainingStatus');

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
            celebrateSuccess();
        } else {
            showStatus('Error: ' + data.message, 'error', 'trainingStatus');
        }
    })
    .catch(error => {
        showStatus('Error training model: ' + error, 'error', 'trainingStatus');
    })
    .finally(() => {
        trainBtn.disabled = false;
        trainBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Train Model
        `;
    });
});

// Load dataset information
function loadDatasetInfo() {
    const datasetInfoDiv = document.getElementById('datasetInfo');
    datasetInfoDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading">Loading dataset...</p>
    `;

    fetch('/get_dataset_info')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.data.length === 0) {
                datasetInfoDiv.innerHTML = '<p class="loading">No data collected yet. Start by capturing face images above.</p>';
            } else {
                let html = '';
                data.data.forEach((person, index) => {
                    html += `
                        <div class="dataset-item" style="animation-delay: ${index * 0.1}s">
                            <div class="person-info">
                                <div class="person-name">👤 ${person.name}</div>
                                <div class="person-images">📸 ${person.images} images</div>
                            </div>
                            <button class="delete-btn" onclick="deletePerson('${person.name}')">Delete</button>
                        </div>
                    `;
                });
                datasetInfoDiv.innerHTML = html;
            }

            // Update training stats
            updateTrainingStats();
        } else {
            datasetInfoDiv.innerHTML = '<p class="loading">Error loading dataset</p>';
        }
    })
    .catch(error => {
        datasetInfoDiv.innerHTML = '<p class="loading">Error: ' + error + '</p>';
    });
}

// Update training statistics
function updateTrainingStats() {
    fetch('/get_dataset_info')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const peopleCount = data.data.length;
            const totalImages = data.data.reduce((sum, person) => sum + person.images, 0);

            document.getElementById('peopleCount').textContent = peopleCount;
            document.getElementById('imageCount').textContent = totalImages;

            // Animate numbers
            animateNumber('peopleCount', peopleCount);
            animateNumber('imageCount', totalImages);
        }
    });
}

// Animate number counting
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let currentValue = 0;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        currentValue += increment;

        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue);
        }
    }, duration / steps);
}

// Delete person
function deletePerson(name) {
    if (!confirm(`Are you sure you want to delete all data for ${name}?\n\nThis action cannot be undone.`)) {
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
            statusText.innerHTML = '✓ Model trained and ready for recognition';
        } else {
            indicator.className = 'status-indicator inactive';
            statusText.innerHTML = '⚠ No model trained yet - capture data and train first';
        }
    })
    .catch(error => {
        console.error('Error checking model status:', error);
    });
}

// Show status message with enhanced animation
function showStatus(message, type, elementId) {
    const statusDiv = document.getElementById(elementId);

    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '✓';
            break;
        case 'error':
            icon = '✗';
            break;
        case 'info':
            icon = 'ℹ';
            break;
    }

    statusDiv.className = 'status-message show ' + type;
    statusDiv.innerHTML = `<strong>${icon}</strong> ${message}`;

    // Auto hide after 5 seconds
    setTimeout(() => {
        statusDiv.classList.remove('show');
    }, 5000);
}

// Celebrate success with visual feedback
function celebrateSuccess() {
    // Create temporary celebration element
    const celebration = document.createElement('div');
    celebration.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4em;
        z-index: 10000;
        pointer-events: none;
        animation: celebrationPop 1s ease-out forwards;
    `;
    celebration.textContent = '🎉';
    document.body.appendChild(celebration);

    // Add keyframe animation
    if (!document.getElementById('celebration-style')) {
        const style = document.createElement('style');
        style.id = 'celebration-style';
        style.textContent = `
            @keyframes celebrationPop {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0);
                }
                50% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8) translateY(-100px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Remove after animation
    setTimeout(() => {
        celebration.remove();
    }, 1000);
}

// Handle errors gracefully
window.addEventListener('error', function(e) {
    console.error('Application error:', e);
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + 1, 2, 3 to switch tabs
    if (e.altKey) {
        switch(e.key) {
            case '1':
                document.querySelector('[data-tab="capture"]').click();
                break;
            case '2':
                document.querySelector('[data-tab="train"]').click();
                break;
            case '3':
                document.querySelector('[data-tab="recognize"]').click();
                break;
        }
    }
});

// Visual feedback on button clicks
document.querySelectorAll('.btn, .tab-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
});

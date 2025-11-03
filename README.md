# Face Recognition System

A comprehensive face recognition system built with Python, OpenCV, and Flask. Features a modern web interface with two panels: data collection (left) and training/recognition (right).

## Features

- **Real-time Face Detection**: Live camera feed with face detection
- **Data Collection**: Capture multiple face images for training
- **Model Training**: Train LBPH face recognition model
- **Live Recognition**: Real-time face recognition with confidence scores
- **Web Interface**: Beautiful, responsive Flask-based UI
- **Dataset Management**: View and delete collected face data
- **Standalone Scripts**: Command-line tools for training and testing

## Project Structure

```
piton/
├── app.py                  # Main Flask application
├── train.py               # Standalone training script
├── test.py                # Standalone testing script
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Web interface HTML
├── static/
│   ├── style.css         # Styling
│   └── script.js         # Frontend JavaScript
├── dataset/              # Face data (auto-created)
│   └── [PersonName]/     # Individual person folders
├── models/               # Trained models (auto-created)
│   ├── face_recognizer.yml
│   ├── labels.pkl
│   └── training_info.txt
└── screenshots/          # Saved screenshots (auto-created)
```

## Installation

### Prerequisites
- Python 3.8 or higher
- Webcam/Camera
- Windows/Linux/MacOS

### Setup

1. **Clone or download the project**

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

The requirements include:
- Flask: Web framework
- opencv-python: Computer vision library
- opencv-contrib-python: Additional OpenCV modules (includes face recognition)
- numpy: Numerical operations
- Werkzeug: WSGI utility library

## Usage

### Method 1: Web Interface (Recommended)

1. **Start the Flask application**:
```bash
python app.py
```

2. **Open your browser** and navigate to:
```
http://localhost:5000
```

3. **Collect Face Data** (Left Panel):
   - Enter a person's name
   - Set number of images to capture (default: 50)
   - Click "Capture Data"
   - The system will automatically capture face images
   - Repeat for multiple people

4. **Train the Model** (Right Panel):
   - Click "Train Model" button
   - Wait for training to complete
   - Model status indicator will turn green

5. **Test Recognition** (Right Panel):
   - Once trained, the live recognition feed automatically shows results
   - Green boxes = Recognized faces
   - Red boxes = Unknown faces
   - Confidence scores displayed

### Method 2: Standalone Scripts

#### Training Script
```bash
python train.py
```
- Reads all images from the `dataset/` folder
- Trains the LBPH face recognition model
- Saves model to `models/` directory
- Displays training summary

#### Testing Script
```bash
python test.py
```
- Loads the trained model
- Opens webcam for live recognition
- Press 'q' to quit
- Press 's' to save screenshot
- Displays recognition results in real-time

## How It Works

### 1. Face Detection
- Uses Haar Cascade Classifier for detecting faces
- Works in real-time with webcam feed

### 2. Data Collection
- Captures face images in grayscale
- Stores images in organized folders by person name
- Automatically handles multiple captures

### 3. Training
- Uses LBPH (Local Binary Patterns Histograms) algorithm
- Trains on all collected face images
- Creates a recognizer model and label mapping

### 4. Recognition
- Detects faces in live video feed
- Predicts identity using trained model
- Shows confidence score (lower is better)
- Threshold: confidence < 100 for positive recognition

## API Endpoints

- `GET /` - Main web interface
- `POST /capture_data` - Capture face images
- `GET /get_dataset_info` - Get dataset information
- `POST /delete_person` - Delete person's data
- `POST /train_model` - Train recognition model
- `GET /video_feed` - Live camera feed
- `GET /recognition_feed` - Live recognition feed
- `GET /check_model` - Check if model is trained

## Configuration

### Adjust Recognition Sensitivity
Edit `app.py` or `test.py` and modify the confidence threshold:
```python
if confidence < 100:  # Change this value (lower = stricter)
```

### Change Number of Training Images
In the web interface, adjust the "Number of Images" field (10-200).

### Modify Face Detection Parameters
Edit the detection parameters in the code:
```python
faces = face_cascade.detectMultiScale(gray, 1.3, 5)
# Parameters: (image, scaleFactor, minNeighbors)
```

## Tips for Best Results

1. **Data Collection**:
   - Capture images in good lighting
   - Include different angles and expressions
   - Minimum 30-50 images per person recommended
   - Ensure face is clearly visible

2. **Training**:
   - More data = better accuracy
   - Include multiple people for better discrimination
   - Retrain when adding new people

3. **Recognition**:
   - Use consistent lighting conditions
   - Face the camera directly
   - Maintain reasonable distance from camera

## Troubleshooting

### Camera Not Working
- Check if camera is connected and not in use by another application
- Try changing camera index in code: `cv2.VideoCapture(1)` instead of `(0)`

### Low Recognition Accuracy
- Collect more training images
- Ensure good lighting during data collection
- Adjust confidence threshold
- Retrain the model

### Module Not Found Errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- For opencv errors, install: `pip install opencv-contrib-python`

### Port Already in Use
- Change port in `app.py`: `app.run(port=5001)`

## Technical Details

- **Face Detection**: Haar Cascade Classifier
- **Face Recognition**: LBPH (Local Binary Patterns Histograms)
- **Web Framework**: Flask
- **Computer Vision**: OpenCV
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)

## Browser Compatibility

- Chrome/Edge (Recommended)
- Firefox
- Safari
- Any modern browser with JavaScript enabled

## Security Notes

- This is a development server; use a production WSGI server for deployment
- Camera access requires HTTPS in production
- Consider adding authentication for production use
- Dataset and models are stored locally

## Future Enhancements

- Add deep learning models (FaceNet, ArcFace)
- User authentication system
- Export/import datasets
- Batch processing
- Mobile app integration
- Cloud deployment

## License

Free to use for educational and personal projects.

## Author

Created with OpenCV, Flask, and Python

---

**Note**: Make sure you have proper lighting and a working webcam for best results!

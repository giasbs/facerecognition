from flask import Flask, render_template, request, jsonify, Response
import cv2
import os
import numpy as np
import pickle
from datetime import datetime
import json

app = Flask(__name__)

# Create necessary directories
os.makedirs('dataset', exist_ok=True)
os.makedirs('models', exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# Load face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Global variables
camera = None
recognizer = None
label_dict = {}

def get_camera():
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
    return camera

def release_camera():
    global camera
    if camera is not None:
        camera.release()
        camera = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/capture_data', methods=['POST'])
def capture_data():
    try:
        data = request.json
        name = data.get('name', '').strip()
        num_images = int(data.get('num_images', 50))

        if not name:
            return jsonify({'success': False, 'message': 'Name is required'})

        # Create directory for this person
        person_dir = os.path.join('dataset', name)
        os.makedirs(person_dir, exist_ok=True)

        # Get existing image count
        existing_images = len([f for f in os.listdir(person_dir) if f.endswith('.jpg')])

        cam = get_camera()
        count = 0
        captured = 0

        while captured < num_images:
            ret, frame = cam.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)

            for (x, y, w, h) in faces:
                count += 1
                if count % 3 == 0:  # Capture every 3rd frame
                    face_img = gray[y:y+h, x:x+w]
                    img_path = os.path.join(person_dir, f'{name}_{existing_images + captured + 1}.jpg')
                    cv2.imwrite(img_path, face_img)
                    captured += 1

                    if captured >= num_images:
                        break

        return jsonify({
            'success': True,
            'message': f'Successfully captured {captured} images for {name}',
            'total_images': existing_images + captured
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/get_dataset_info', methods=['GET'])
def get_dataset_info():
    try:
        dataset_info = []
        if os.path.exists('dataset'):
            for person_name in os.listdir('dataset'):
                person_dir = os.path.join('dataset', person_name)
                if os.path.isdir(person_dir):
                    num_images = len([f for f in os.listdir(person_dir) if f.endswith('.jpg')])
                    dataset_info.append({
                        'name': person_name,
                        'images': num_images
                    })

        return jsonify({'success': True, 'data': dataset_info})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/delete_person', methods=['POST'])
def delete_person():
    try:
        data = request.json
        name = data.get('name', '').strip()

        person_dir = os.path.join('dataset', name)
        if os.path.exists(person_dir):
            import shutil
            shutil.rmtree(person_dir)
            return jsonify({'success': True, 'message': f'Deleted data for {name}'})
        else:
            return jsonify({'success': False, 'message': 'Person not found'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/train_model', methods=['POST'])
def train_model():
    try:
        faces = []
        labels = []
        label_dict = {}
        current_label = 0

        if not os.path.exists('dataset'):
            return jsonify({'success': False, 'message': 'No dataset found'})

        # Read all images
        for person_name in os.listdir('dataset'):
            person_dir = os.path.join('dataset', person_name)
            if not os.path.isdir(person_dir):
                continue

            label_dict[current_label] = person_name

            for image_name in os.listdir(person_dir):
                if image_name.endswith('.jpg'):
                    img_path = os.path.join(person_dir, image_name)
                    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

                    if img is not None:
                        faces.append(img)
                        labels.append(current_label)

            current_label += 1

        if len(faces) == 0:
            return jsonify({'success': False, 'message': 'No training data found'})

        # Train the recognizer
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.train(faces, np.array(labels))

        # Save the model
        recognizer.save('models/face_recognizer.yml')

        # Save label dictionary
        with open('models/labels.pkl', 'wb') as f:
            pickle.dump(label_dict, f)

        return jsonify({
            'success': True,
            'message': f'Model trained successfully with {len(faces)} images from {len(label_dict)} persons',
            'persons': len(label_dict),
            'images': len(faces)
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def generate_frames():
    cam = get_camera()

    while True:
        ret, frame = cam.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/recognition_feed')
def recognition_feed():
    return Response(generate_recognition_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def generate_recognition_frames():
    global recognizer, label_dict

    # Load model if exists
    if os.path.exists('models/face_recognizer.yml'):
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.read('models/face_recognizer.yml')

        with open('models/labels.pkl', 'rb') as f:
            label_dict = pickle.load(f)
    else:
        recognizer = None

    cam = get_camera()

    while True:
        ret, frame = cam.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            face_img = gray[y:y+h, x:x+w]

            if recognizer is not None:
                label, confidence = recognizer.predict(face_img)

                if confidence < 100:  # Threshold for recognition
                    name = label_dict.get(label, 'Unknown')
                    confidence_text = f'{100 - confidence:.1f}%'
                    color = (0, 255, 0)
                else:
                    name = 'Unknown'
                    confidence_text = 'N/A'
                    color = (0, 0, 255)

                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                cv2.putText(frame, f'{name} ({confidence_text})', (x, y-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            else:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
                cv2.putText(frame, 'No Model Trained', (x, y-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/check_model', methods=['GET'])
def check_model():
    model_exists = os.path.exists('models/face_recognizer.yml')
    return jsonify({'model_exists': model_exists})

if __name__ == '__main__':
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    finally:
        release_camera()

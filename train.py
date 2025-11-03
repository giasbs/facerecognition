"""
Standalone training script for face recognition model
This script can be run separately to train the model without using Flask
"""

import cv2
import os
import numpy as np
import pickle
from datetime import datetime

def train_model():
    """
    Train face recognition model using collected dataset
    """
    print("="*50)
    print("Face Recognition Model Training")
    print("="*50)

    # Initialize face recognizer
    recognizer = cv2.face.LBPHFaceRecognizer_create()

    # Check if dataset exists
    if not os.path.exists('dataset'):
        print("Error: Dataset folder not found!")
        print("Please run data collection first.")
        return False

    faces = []
    labels = []
    label_dict = {}
    current_label = 0

    # Read all images from dataset
    print("\nReading training images...")

    for person_name in os.listdir('dataset'):
        person_dir = os.path.join('dataset', person_name)

        if not os.path.isdir(person_dir):
            continue

        print(f"Processing: {person_name}")
        label_dict[current_label] = person_name
        image_count = 0

        for image_name in os.listdir(person_dir):
            if image_name.endswith('.jpg') or image_name.endswith('.png'):
                img_path = os.path.join(person_dir, image_name)
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

                if img is not None:
                    # Resize image to standard size
                    img = cv2.resize(img, (200, 200))
                    faces.append(img)
                    labels.append(current_label)
                    image_count += 1

        print(f"  - Loaded {image_count} images")
        current_label += 1

    if len(faces) == 0:
        print("\nError: No training images found!")
        return False

    print(f"\nTotal images loaded: {len(faces)}")
    print(f"Total persons: {len(label_dict)}")

    # Train the model
    print("\nTraining model...")
    recognizer.train(faces, np.array(labels))

    # Create models directory
    os.makedirs('models', exist_ok=True)

    # Save the trained model
    model_path = 'models/face_recognizer.yml'
    recognizer.save(model_path)
    print(f"Model saved to: {model_path}")

    # Save label dictionary
    labels_path = 'models/labels.pkl'
    with open(labels_path, 'wb') as f:
        pickle.dump(label_dict, f)
    print(f"Labels saved to: {labels_path}")

    # Save training info
    info_path = 'models/training_info.txt'
    with open(info_path, 'w') as f:
        f.write(f"Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Images: {len(faces)}\n")
        f.write(f"Total Persons: {len(label_dict)}\n")
        f.write("\nPersons:\n")
        for label, name in label_dict.items():
            count = labels.count(label)
            f.write(f"  - {name}: {count} images\n")

    print(f"Training info saved to: {info_path}")

    print("\n" + "="*50)
    print("Training completed successfully!")
    print("="*50)

    # Print summary
    print("\nTraining Summary:")
    for label, name in label_dict.items():
        count = labels.count(label)
        print(f"  {name}: {count} images")

    return True

def test_model_load():
    """
    Test if the trained model can be loaded
    """
    print("\nTesting model load...")

    try:
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.read('models/face_recognizer.yml')

        with open('models/labels.pkl', 'rb') as f:
            label_dict = pickle.load(f)

        print("Model loaded successfully!")
        print(f"Number of persons in model: {len(label_dict)}")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

if __name__ == '__main__':
    success = train_model()

    if success:
        test_model_load()

    input("\nPress Enter to exit...")

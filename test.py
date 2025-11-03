"""
Standalone testing script for face recognition
This script runs real-time face recognition using the trained model
"""

import cv2
import os
import pickle
import numpy as np

def test_recognition():
    """
    Test face recognition in real-time using webcam
    """
    print("="*50)
    print("Face Recognition Testing")
    print("="*50)

    # Check if model exists
    if not os.path.exists('models/face_recognizer.yml'):
        print("\nError: No trained model found!")
        print("Please train the model first using train.py or the web interface.")
        input("\nPress Enter to exit...")
        return

    # Load the trained model
    print("\nLoading trained model...")
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read('models/face_recognizer.yml')

    # Load label dictionary
    with open('models/labels.pkl', 'rb') as f:
        label_dict = pickle.load(f)

    print(f"Model loaded successfully!")
    print(f"Recognized persons: {', '.join(label_dict.values())}")

    # Load face detector
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Initialize webcam
    print("\nInitializing webcam...")
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open webcam!")
        input("\nPress Enter to exit...")
        return

    print("\n" + "="*50)
    print("Recognition Started!")
    print("="*50)
    print("\nInstructions:")
    print("  - Green box: Person recognized")
    print("  - Red box: Unknown person")
    print("  - Press 'q' to quit")
    print("  - Press 's' to save screenshot")
    print("="*50 + "\n")

    screenshot_count = 0

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                print("Error: Failed to capture frame")
                break

            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            # Detect faces
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.3,
                minNeighbors=5,
                minSize=(50, 50)
            )

            # Process each detected face
            for (x, y, w, h) in faces:
                # Extract face region
                face_img = gray[y:y+h, x:x+w]

                # Resize to match training size
                face_img = cv2.resize(face_img, (200, 200))

                # Predict
                label, confidence = recognizer.predict(face_img)

                # Confidence threshold (lower is better)
                if confidence < 100:
                    name = label_dict.get(label, 'Unknown')
                    confidence_text = f'{100 - confidence:.1f}%'
                    color = (0, 255, 0)  # Green
                    status = "Recognized"
                else:
                    name = 'Unknown'
                    confidence_text = 'N/A'
                    color = (0, 0, 255)  # Red
                    status = "Unknown"

                # Draw rectangle around face
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)

                # Draw name and confidence
                text = f'{name} ({confidence_text})'
                cv2.putText(frame, text, (x, y-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

                # Print to console
                print(f"[{status}] {name} - Confidence: {confidence_text}")

            # Add instructions on frame
            cv2.putText(frame, "Press 'q' to quit | 's' to save screenshot",
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            # Display the frame
            cv2.imshow('Face Recognition Test', frame)

            # Check for key press
            key = cv2.waitKey(1) & 0xFF

            if key == ord('q'):
                print("\nQuitting...")
                break
            elif key == ord('s'):
                # Save screenshot
                os.makedirs('screenshots', exist_ok=True)
                screenshot_count += 1
                screenshot_path = f'screenshots/screenshot_{screenshot_count}.jpg'
                cv2.imwrite(screenshot_path, frame)
                print(f"Screenshot saved: {screenshot_path}")

    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        print("\nCamera released and windows closed")

    print("\n" + "="*50)
    print("Testing completed!")
    print("="*50)

def check_model_info():
    """
    Display information about the trained model
    """
    if not os.path.exists('models/training_info.txt'):
        return

    print("\n" + "="*50)
    print("Model Information")
    print("="*50)

    with open('models/training_info.txt', 'r') as f:
        print(f.read())

if __name__ == '__main__':
    check_model_info()
    test_recognition()
    input("\nPress Enter to exit...")

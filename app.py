from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pyttsx3
import os

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

UPLOAD_FOLDER = 'saved_files'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return "Speech Processing App Backend"

# Endpoint for text-to-speech
@app.route('/speak', methods=['POST'])
def speak():
    data = request.json
    text = data.get('text', '')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        engine = pyttsx3.init()
        engine.say(text)
        engine.runAndWait()
        return jsonify({'message': 'Speech synthesis completed successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint to save text to a file
@app.route('/save', methods=['POST'])
def save():
    data = request.json
    text = data.get('text', '')
    filename = data.get('filename', '')

    if not text or not filename:
        return jsonify({'error': 'Text or filename missing'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, f"{filename}.txt")

    if os.path.exists(filepath):
        return jsonify({'error': 'File already exists'}), 400

    try:
        with open(filepath, 'w') as file:
            file.write(text)
        return jsonify({'message': 'File saved successfully', 'filepath': filepath})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint to download a saved file
@app.route('/download/<filename>', methods=['GET'])
def download(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
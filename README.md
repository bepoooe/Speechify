# Speechify - Voice Processing Web Application

Speechify is a modern web application that provides speech-to-text and text-to-speech capabilities with a sleek, user-friendly interface. Built with HTML, CSS, JavaScript, and Python Flask backend, it offers a seamless voice processing experience.

## Features

- **Speech Recognition**: Convert spoken words to text in real-time
- **Text-to-Speech**: Convert written text to natural-sounding speech
- **File Management**: Save transcribed text to files for later use
- **Modern UI**: Clean, responsive interface with smooth animations
- **Cross-Browser Support**: Works on modern browsers (Chrome and Edge recommended)

## Getting Started

### Prerequisites

- Python 3.6 or higher
- Flask web framework
- pyttsx3 library
- Modern web browser (Chrome or Edge recommended)

### Installation

1. Clone the repository or download the files
2. Install the required Python packages:
```bash
pip install flask flask-cors pyttsx3
```

### Running the Application

1. Start the Flask backend server:
```bash
python app.py
```
2. Open `index.html` in your web browser
3. The application should now be running at `http://localhost:5000`

## Usage

1. **Speech-to-Text**:
   - Click the "Record" button to start speech recognition
   - Speak clearly into your microphone
   - The recognized text will appear in the text area
   - Click "Stop" to end recording

2. **Text-to-Speech**:
   - Enter or paste text into the text area
   - Click the "Speak" button to hear the text
   - The app will read the text aloud using your system's speech synthesis

3. **Saving Text**:
   - Enter text in the text area
   - Click the "Save" button
   - Enter a filename when prompted
   - The text will be saved as a .txt file

4. **Clearing Text**:
   - Click the "Clear" button to remove all text
   - Confirm the action in the dialog box

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python Flask with CORS support
- **Speech Recognition**: Web Speech API
- **Text-to-Speech**: Web Speech Synthesis API
- **File Handling**: Blob API for frontend, Flask for backend

## Browser Support

- Google Chrome (recommended)
- Microsoft Edge
- Other modern browsers with Web Speech API support

## Contributing

Feel free to fork the project and submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.

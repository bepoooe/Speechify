# 🎤 Speechify - Advanced Voice Processing Web Application

Speechify is a cutting-edge web application that provides powerful speech-to-text and text-to-speech capabilities with an elegant, responsive interface. Built with modern web technologies, it delivers a seamless voice processing experience across all devices.

## 🚀 Live Demo

**Try Speechify now:**
- **Vercel Deployment**: [https://speechify-ivory.vercel.app/](https://speechify-ivory.vercel.app/)
- **GitHub Pages**: [https://bepoooe.github.io/Speechify/](https://bepoooe.github.io/Speechify/)

## ✨ Features

- **🎙️ Real-time Speech Recognition**: Convert spoken words to text with high accuracy
- **🔊 Advanced Text-to-Speech**: Natural-sounding voice synthesis with customizable settings
- **⚙️ Voice Customization**: Adjust speech rate, pitch, and select from available voices
- **💾 File Management**: Save transcribed text as downloadable files
- **🎨 Modern UI/UX**: Beautiful, responsive interface with smooth animations
- **📱 Mobile Optimized**: Fully responsive design that works on all devices
- **🌐 Cross-Browser Support**: Compatible with Chrome, Edge, and other modern browsers
- **🔧 Settings Panel**: Customizable voice parameters and preferences
- **🐛 Debug Tools**: Built-in debugging capabilities for troubleshooting

## 🛠️ Quick Start

### Option 1: Use Live Demo (Recommended)
Simply visit one of our live deployments:
- [Vercel](https://speechify-ivory.vercel.app/) - Fastest loading
- [GitHub Pages](https://bepoooe.github.io/Speechify/) - Alternative mirror

### Option 2: Run Locally

#### Prerequisites
- Modern web browser (Chrome or Edge recommended for best speech recognition support)
- Optional: Python 3.6+ (only needed for backend features)

#### Simple Setup (Frontend Only)
1. Clone the repository:
```bash
git clone https://github.com/bepoooe/Speechify.git
cd Speechify
```

2. Open `index.html` in your web browser or serve it locally:
```bash
# Using Python's built-in server
python -m http.server 8000

# Using Node.js (if you have it installed)
npx serve .

# Or simply open index.html directly in your browser
```

#### Full Setup (With Backend)
1. Clone and navigate to the repository
2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask backend:
```bash
python app.py
```

4. Open `index.html` in your browser
5. The application will be available at `http://localhost:5000`

## 📖 How to Use

### Basic Operations

1. **🎙️ Speech-to-Text**:
   - Click the "Record" button to start speech recognition
   - Speak clearly into your microphone
   - Watch as your words appear in real-time in the text area
   - Click "Record" again to stop recording

2. **🔊 Text-to-Speech**:
   - Type or paste text into the text area
   - Click the "Speak" button to hear the text read aloud
   - The app uses your browser's speech synthesis engine

3. **💾 Saving Text**:
   - Click the "Save" button after entering text
   - Enter a filename in the dialog box
   - The text will be downloaded as a .txt file

4. **🗑️ Clearing Text**:
   - Click the "Clear" button to remove all text
   - Confirm the action in the confirmation dialog

### Advanced Features

5. **⚙️ Settings Panel**:
   - Click the gear icon to open settings
   - Adjust voice speed and pitch
   - Select different voices (if available)
   - Reset settings to defaults

6. **🐛 Debug Mode**:
   - Press `Shift + D` to access debug tools
   - View browser compatibility information
   - Troubleshoot speech recognition issues

## 🔧 Technical Details

### Frontend Technologies
- **HTML5**: Semantic markup with modern web standards
- **CSS3**: Advanced styling with animations and responsive design
- **JavaScript (ES6+)**: Modern JavaScript with async/await and modules
- **Web APIs**: Speech Recognition API, Speech Synthesis API, Blob API

### Backend (Optional)
- **Python Flask**: Lightweight web framework
- **Flask-CORS**: Cross-origin resource sharing support
- **pyttsx3**: Text-to-speech library for server-side synthesis

### Key Features Implementation
- **Responsive Design**: CSS Grid and Flexbox for mobile-first approach
- **Progressive Enhancement**: Works without backend, enhanced with it
- **Error Handling**: Comprehensive error handling and user feedback
- **Accessibility**: ARIA labels and keyboard navigation support
- **Performance**: Optimized animations and efficient DOM manipulation

## 🌐 Browser Support

| Browser | Speech Recognition | Text-to-Speech | Overall Support |
|---------|-------------------|----------------|-----------------|
| Chrome | ✅ Excellent | ✅ Excellent | ✅ Recommended |
| Edge | ✅ Excellent | ✅ Excellent | ✅ Recommended |
| Firefox | ⚠️ Limited | ✅ Good | ⚠️ Partial |
| Safari | ⚠️ Limited | ✅ Good | ⚠️ Partial |

## 🚀 Deployment

This project is deployed on multiple platforms:

### Vercel Deployment
- **URL**: [https://speechify-ivory.vercel.app/](https://speechify-ivory.vercel.app/)
- **Features**: Automatic deployments, global CDN, optimized performance

### GitHub Pages
- **URL**: [https://bepoooe.github.io/Speechify/](https://bepoooe.github.io/Speechify/)
- **Features**: Free hosting, automatic updates from main branch

### Deploy Your Own

#### Deploy to Vercel
1. Fork this repository
2. Connect your GitHub account to Vercel
3. Import the project and deploy

#### Deploy to GitHub Pages
1. Fork this repository
2. Go to Settings > Pages in your repository
3. Select "Deploy from a branch" and choose `main`
4. Your site will be available at `https://yourusername.github.io/Speechify/`

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Test your changes across different browsers
- Update documentation as needed
- Ensure mobile responsiveness

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Created by **bepoooe** - [GitHub Profile](https://github.com/bepoooe)

## 🙏 Acknowledgments

- Web Speech API for enabling browser-based speech recognition
- Font Awesome for beautiful icons
- Modern CSS techniques for responsive design
- The open-source community for inspiration and tools

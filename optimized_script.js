// Main script file for Speechify app
const textArea = document.getElementById('text');
const statusMessage = document.getElementById('status-message');
let recognition;

// Function to show animated status messages
function showStatus(message, isError = false) {
    // Remove any existing animation classes
    statusMessage.classList.remove('active', 'fade-out');
    
    // Force a reflow to ensure animations work properly
    void statusMessage.offsetWidth;
    
    statusMessage.textContent = message;
    statusMessage.classList.add('active');
    statusMessage.style.background = isError ? '#FEF2F2' : '#ECFDF5';
    statusMessage.style.color = isError ? '#DC2626' : '#047857';
    
    setTimeout(() => {
        statusMessage.classList.add('fade-out');
        setTimeout(() => {
            statusMessage.classList.remove('active', 'fade-out');
        }, 500);
    }, 3000);
}

// Debounce function to prevent rapid button clicks
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Function to add animation to buttons when pressed - optimized for mobile
function animateButton(buttonElement) {
    // Check if button is already animating to prevent multiple animations
    if (buttonElement.classList.contains('animate')) {
        return;
    }
    
    // Detect if device is mobile for optimized animations
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    
    // Use shorter, more performant animations on mobile
    buttonElement.classList.add('animate');
    setTimeout(() => {
        buttonElement.classList.remove('animate');
    }, isMobile ? 200 : 400); // Shorter animation time for mobile
}

// Function to reset the microphone button
function resetMicButton() {
    const micButton = document.getElementById('activate-mic');
    micButton.innerHTML = '<i class="fas fa-microphone"></i>Record';
    micButton.style.background = 'var(--primary)';
    micButton.style.animation = 'none';
    micButton.removeAttribute('data-processing');
}

// Function to activate the microphone and recognize speech
document.getElementById('activate-mic').addEventListener('click', function() {
    const micButton = this;
    
    // Prevent multiple rapid clicks
    if (micButton.getAttribute('data-processing') === 'true') {
        return;
    }
    
    micButton.setAttribute('data-processing', 'true');
    animateButton(micButton);
    
    if (!('speechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
        showStatus('Speech Recognition is not supported in your browser. Please use Chrome or Edge.', true);
        micButton.removeAttribute('data-processing');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    
    // For mobile devices, disable continuous mode to prevent repetition issues
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    recognition.continuous = !isMobile; // Disable continuous mode on mobile
    recognition.interimResults = true;
    
    recognition.onstart = () => {
        showStatus('Listening... Speak now!');
        micButton.innerHTML = '<i class="fas fa-stop"></i>Stop';
        micButton.style.background = 'var(--danger)';
        micButton.style.animation = 'blink 1.5s infinite';
        
        // On mobile, we'll restart recognition when it ends
        // because continuous mode is disabled
        if (isMobile) {
            recognition._isListening = true;
        }
    };

    recognition.onspeechend = () => {
        recognition.stop();
    };
    
    recognition.onresult = (event) => {
        // Get the current transcript from the most recent result
        const currentResult = event.results[event.results.length - 1];
        
        // Only process final results (especially important for mobile)
        if (currentResult.isFinal) {
            const transcript = currentResult[0].transcript.trim();
            
            if (transcript) {
                if (isMobile) {
                    // For mobile: Just append this single result
                    if (textArea.value) {
                        // Add space only if the textarea already has content
                        textArea.value += ' ' + transcript;
                    } else {
                        textArea.value = transcript;
                    }
                } else {
                    // For desktop: Same behavior
                    if (textArea.value) {
                        textArea.value += ' ' + transcript;
                    } else {
                        textArea.value = transcript;
                    }
                }
                
                // Add a subtle animation to the textarea when new text appears
                textArea.style.animation = 'none';
                void textArea.offsetWidth; // Force reflow
                textArea.style.animation = 'scaleIn 0.3s ease';
            }
        }
    };

    recognition.onerror = (event) => {
        showStatus('Error occurred: ' + event.error, true);
        resetMicButton();
    };
    
    recognition.onend = () => {
        // On mobile, we need to restart recognition manually since continuous mode is disabled
        if (isMobile && recognition._isListening) {
            // Start recognition again after a small delay to avoid rapid restarts
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    // If there's an error restarting (already started or other issue)
                    recognition._isListening = false;
                    resetMicButton();
                    showStatus('Recording stopped');
                }
            }, 300);
        } else {
            resetMicButton();
            showStatus('Recording stopped');
        }
    };
    
    // If recognition is already active, stop it
    if (recognition._isListening) {
        recognition._isListening = false; // Set flag to prevent auto-restart on mobile
        recognition.stop();
    } else {
        recognition._isListening = true;
        recognition.start();
    }
});

// Function to convert text to speech - with debounce for mobile
document.getElementById('speak').addEventListener('click', debounce(function() {
    const speakButton = this;
    
    // Prevent multiple rapid clicks
    if (speakButton.getAttribute('data-processing') === 'true') {
        return;
    }
    
    speakButton.setAttribute('data-processing', 'true');
    animateButton(speakButton);
    
    const text = textArea.value.trim();
    if (!text) {
        showStatus('Please enter some text to speak.', true);
        speakButton.removeAttribute('data-processing');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    
    // Optional: Get available voices and set a better one
    let voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
        // Try to find a nice English voice
        const preferredVoice = voices.find(voice => 
            voice.lang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Premium'))
        ) || voices[0];
        speech.voice = preferredVoice;
    }
    
    speech.rate = 1.0;  // Speed of speech (0.1 to 10)
    speech.pitch = 1.0; // Pitch of speech (0 to 2)
    
    speech.onstart = () => {
        showStatus('Speaking...');
        speakButton.innerHTML = '<i class="fas fa-pause"></i>Pause';
        speakButton.style.animation = 'pulse 1.5s infinite alternate';
    };
    
    speech.onend = () => {
        speakButton.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
        speakButton.style.animation = 'none';
        speakButton.removeAttribute('data-processing');
        showStatus('Finished speaking');
    };
    
    window.speechSynthesis.speak(speech);
}, 250));

// Function to show animated message
function showAnimatedMessage(message, icon = 'check-circle', duration = 2000) {
    const messageElement = document.getElementById('success-message');
    const iconElement = messageElement.querySelector('.message-icon i');
    const textElement = messageElement.querySelector('.message-text');
    
    // Set message and icon
    textElement.textContent = message;
    iconElement.className = `fas fa-${icon}`;
    
    // Show message with animation
    messageElement.classList.add('active');
    
    // Hide after duration
    setTimeout(() => {
        messageElement.classList.remove('active');
    }, duration);
}

// Function to save text to a file
document.getElementById('save').addEventListener('click', debounce(function() {
    const saveButton = this;
    
    // Prevent multiple rapid clicks
    if (saveButton.getAttribute('data-processing') === 'true') {
        return;
    }
    
    saveButton.setAttribute('data-processing', 'true');
    animateButton(saveButton);
    
    const text = textArea.value.trim();
    if (!text) {
        showStatus('Please enter some text to save.', true);
        saveButton.removeAttribute('data-processing');
        return;
    }

    // Show custom filename dialog
    const dialog = document.getElementById('filename-dialog');
    const filenameInput = document.getElementById('filename-input');
    dialog.classList.add('active');
    filenameInput.focus();
    filenameInput.select();
    
    // Handle dialog buttons
    document.getElementById('cancel-save').onclick = () => {
        dialog.classList.remove('active');
        saveButton.removeAttribute('data-processing');
    };
    
    document.getElementById('confirm-save').onclick = () => {
        let filename = filenameInput.value.trim();
        
        if (!filename) {
            showStatus('Filename cannot be empty.', true);
            return;
        }
        
        // Sanitize filename (remove invalid characters)
        filename = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
        
        const blob = new Blob([text], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.txt`;
        
        // Add animation before saving
        saveButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>Saving';
        
        setTimeout(() => {
            link.click();
            saveButton.innerHTML = '<i class="fas fa-check"></i>Saved!';
            
            // Show animated message instead of status
            showAnimatedMessage(`Saved as ${filename}.txt`, 'file-download');
            
            setTimeout(() => {
                saveButton.innerHTML = '<i class="fas fa-save"></i>Save';
                dialog.classList.remove('active');
                saveButton.removeAttribute('data-processing');
                // Reset input value for next time
                filenameInput.value = 'speechify_text';
            }, 1500);
        }, 500);
    };

    // Handle Enter key in the input field
    const enterKeyHandler = (e) => {
        if (e.key === 'Enter') {
            document.getElementById('confirm-save').click();
        } else if (e.key === 'Escape') {
            document.getElementById('cancel-save').click();
        }
    };
    
    // Remove previous event listener to prevent duplicates
    filenameInput.removeEventListener('keyup', enterKeyHandler);
    // Add new event listener
    filenameInput.addEventListener('keyup', enterKeyHandler);
}, 250));

// Show confirmation dialog for clearing text
document.getElementById('clear').addEventListener('click', debounce(function() {
    const clearButton = this;
    
    // Prevent multiple rapid clicks
    if (clearButton.getAttribute('data-processing') === 'true') {
        return;
    }
    
    clearButton.setAttribute('data-processing', 'true');
    animateButton(clearButton);
    
    if (textArea.value.trim()) {
        // Show custom confirmation dialog instead of browser's confirm
        const dialog = document.getElementById('clear-confirmation');
        dialog.classList.add('active');
        
        // Handle dialog buttons
        document.getElementById('cancel-clear').onclick = () => {
            dialog.classList.remove('active');
            clearButton.removeAttribute('data-processing');
        };
        
        document.getElementById('confirm-clear').onclick = () => {
            dialog.classList.remove('active');
            
            // Add a fade-out animation to the text before clearing
            textArea.style.transition = 'opacity 0.3s';
            textArea.style.opacity = '0';
            
            setTimeout(() => {
                textArea.value = '';
                textArea.style.opacity = '1';
                clearButton.removeAttribute('data-processing');
                
                // Show animated message
                showAnimatedMessage('Text cleared successfully', 'trash-alt');
            }, 300);
        };
    } else {
        showAnimatedMessage('Nothing to clear', 'info-circle');
        clearButton.removeAttribute('data-processing');
    }
}, 250));

// Initialize voices for speech synthesis
window.speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
};

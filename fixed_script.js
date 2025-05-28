// Main script file for Speechify app
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const textArea = document.getElementById('text');
    const statusMessage = document.getElementById('status-message');
    let recognition;
    let speechSynthesisActive = false;
    let currentSpeech = null;
    
    // Detect if device is mobile
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Add a class to body for mobile-specific styling if needed
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }
    
    // User settings with defaults
    let userSettings = {
        voiceSpeed: 1.0,
        voicePitch: 1.0,
        selectedVoice: '',
        darkMode: false
    };
    
    // Function to load user settings from localStorage
    function loadUserSettings() {
        try {
            const savedSettings = localStorage.getItem('speechifySettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                userSettings = { ...userSettings, ...parsedSettings };
            }
            return userSettings;
        } catch (e) {
            console.error('Error loading settings:', e);
            return userSettings;
        }
    }
    
    // Function to save user settings to localStorage
    function saveUserSettings() {
        try {
            localStorage.setItem('speechifySettings', JSON.stringify(userSettings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }
    
    // Load settings on startup
    loadUserSettings();
    
    // Apply dark mode if enabled in settings
    if (userSettings.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('dark-mode-toggle').checked = true;
    }
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
        
        // Dark mode adjustments
        if (document.body.classList.contains('dark-mode')) {
            statusMessage.style.background = isError ? '#7F1D1D' : '#064E3B';
            statusMessage.style.color = '#FFFFFF';
        }
        
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
            
            // Add a flag to indicate the function is waiting to execute
            if (this.getAttribute && !this.getAttribute('data-waiting')) {
                this.setAttribute('data-waiting', 'true');
                
                // For mobile devices, provide immediate visual feedback
                if (isMobile && this.classList) {
                    this.classList.add('waiting');
                }
            }
            
            timeout = setTimeout(() => {
                // Clear waiting flags
                if (this.getAttribute) {
                    this.removeAttribute('data-waiting');
                    if (this.classList) {
                        this.classList.remove('waiting');
                    }
                }
                func.apply(context, args);
            }, isMobile ? wait * 1.2 : wait); // Slightly longer wait on mobile for better UX
        };
    }
    
    // Function to add animation to buttons when pressed - optimized for mobile
    function animateButton(buttonElement) {
        // Check if button is already animating to prevent multiple animations
        if (buttonElement.classList.contains('animate')) {
            return;
        }
        
        // For mobile, use hardware-accelerated animations
        if (isMobile) {
            buttonElement.style.willChange = 'transform, opacity';
        }
        
        // Use shorter, more performant animations on mobile
        buttonElement.classList.add('animate');
        setTimeout(() => {
            buttonElement.classList.remove('animate');
            
            // Reset will-change to optimize memory usage
            if (isMobile) {
                setTimeout(() => {
                    buttonElement.style.willChange = 'auto';
                }, 300);
            }
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
    
    // Initialize speech recognition
    function initSpeechRecognition() {
        // First check for the new standard API
        if ('SpeechRecognition' in window) {
            console.log('Using standard SpeechRecognition API');
        } 
        // Then check for the webkit prefixed version
        else if ('webkitSpeechRecognition' in window) {
            console.log('Using webkit prefixed SpeechRecognition API');
        } 
        // Neither API is available
        else {
            console.error('Speech Recognition API not supported in this browser');
            showStatus('Speech Recognition is not supported in your browser. Please use Chrome or Edge.', true);
            return null;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        // Configure recognition settings
        recognitionInstance.lang = 'en-US';
        recognitionInstance.continuous = !isMobile; // Disable continuous mode on mobile
        recognitionInstance.interimResults = true;
        
        // Log that we created the recognition instance
        console.log('Speech recognition instance created successfully');
        
        // For mobile, use a more aggressive approach to prevent repetition
        if (isMobile) {
            // Lower the maximum alternatives to reduce processing
            recognitionInstance.maxAlternatives = 1;
            // Initialize storage for previous texts to prevent repetition
            recognitionInstance._lastRecognizedText = '';
            // Add a buffer to handle partial recognitions better
            recognitionInstance._textBuffer = [];
            // Maximum time between recognition restarts on mobile
            recognitionInstance._restartDelay = 300;
        } else {
            // For desktop, we can use more alternatives
            recognitionInstance.maxAlternatives = 3;
        }
        
        return recognitionInstance;
    }
      // Function to handle speech recognition results
    function handleRecognitionResults(event) {
        console.log('Processing speech recognition results', event);
        // Get the current transcript from the most recent result
        const currentResult = event.results[event.results.length - 1];
        
        // Only process final results (especially important for mobile)
        if (currentResult.isFinal) {
            const transcript = currentResult[0].transcript.trim();
            console.log('Final transcript:', transcript);
            
            // Initialize storage for previous texts if not already
            if (!recognition._lastRecognizedText) {
                recognition._lastRecognizedText = '';
            }
            
            if (!recognition._textBuffer) {
                recognition._textBuffer = [];
            }
            
            // Process the transcript only if it's not empty and not a repetition
            if (transcript && 
                !transcript.startsWith(recognition._lastRecognizedText) && 
                !recognition._lastRecognizedText.endsWith(transcript)) {
                
                // Check against buffer to avoid repetitions across restarts
                let isRepetition = false;
                
                // Check against recent buffers to avoid adding the same text again
                for (const bufferedText of recognition._textBuffer) {
                    if (transcript === bufferedText || 
                        bufferedText.includes(transcript) || 
                        transcript.includes(bufferedText)) {
                        isRepetition = true;
                        break;
                    }
                }
                
                if (!isRepetition) {
                    console.log('Adding transcript to textarea:', transcript);
                    // Append text with space if needed
                    if (textArea.value) {
                        textArea.value += ' ' + transcript;
                    } else {
                        textArea.value = transcript;
                    }
                    
                    // Store in buffer to prevent future repetitions
                    recognition._textBuffer.push(transcript);
                    if (recognition._textBuffer.length > 5) {
                        // Only keep the last 5 recognized texts
                        recognition._textBuffer.shift();
                    }
                    
                    // Update last recognized text
                    recognition._lastRecognizedText = transcript;
                    
                    // Add a subtle animation to the textarea when new text appears
                    textArea.style.animation = 'none';
                    void textArea.offsetWidth; // Force reflow
                    textArea.style.animation = 'scaleIn 0.3s ease';
                } else {
                    console.log('Skipping repetitive transcript');
                }
            }
        } else {
            console.log('Interim result received, waiting for final result');
        }
    }
    
    // Function to activate the microphone and recognize speech
    document.getElementById('activate-mic').addEventListener('click', debounce(function() {
        const micButton = this;
        
        // Prevent multiple rapid clicks
        if (micButton.getAttribute('data-processing') === 'true') {
            return;
        }
        
        micButton.setAttribute('data-processing', 'true');
        animateButton(micButton);
        
        // First, check if the browser supports speech recognition
        if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
            showStatus('Speech Recognition is not supported in your browser. Please use Chrome or Edge.', true);
            micButton.removeAttribute('data-processing');
            return;
        }
        
        // If recognition is already active, stop it
        if (recognition && recognition._isListening) {
            console.log('Stopping active speech recognition');
            recognition._isListening = false; // Set flag to prevent auto-restart on mobile
            try {
                recognition.stop();
                resetMicButton();
                showStatus('Recording stopped');
                micButton.removeAttribute('data-processing');
            } catch (e) {
                console.error('Error stopping recognition:', e);
                resetMicButton();
                micButton.removeAttribute('data-processing');
            }
            return;
        }
        
        // Check for microphone permissions first
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                // Permission granted, stop the tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
                
                console.log('Microphone permission granted');
                
                // Initialize speech recognition if not already done
                if (!recognition) {
                    recognition = initSpeechRecognition();
                    if (!recognition) {
                        showStatus('Failed to initialize speech recognition.', true);
                        micButton.removeAttribute('data-processing');
                        return;
                    }
                    
                    // Set up event handlers for the recognition object
                    recognition.onstart = () => {
                        console.log('Speech recognition started');
                        showStatus('Listening... Speak now!');
                        micButton.innerHTML = '<i class="fas fa-stop"></i>Stop';
                        micButton.style.background = 'var(--danger)';
                        micButton.style.animation = 'blink 1.5s infinite';
                        micButton.removeAttribute('data-processing');
                        
                        // On mobile, we'll restart recognition when it ends
                        if (isMobile) {
                            recognition._isListening = true;
                        }
                    };
                    
                    recognition.onspeechend = () => {
                        console.log('Speech ended event triggered');
                        if (!isMobile) {
                            recognition.stop();
                        }
                    };
                    
                    recognition.onresult = function(event) {
                        console.log('Speech recognition result received', event);
                        handleRecognitionResults(event);
                    };
                    
                    recognition.onerror = (event) => {
                        console.error('Speech recognition error:', event.error);
                        
                        // Handle different error types
                        if (event.error === 'aborted') {
                            showStatus('Recognition stopped', false);
                        } else if (event.error === 'network') {
                            showStatus('Network error. Check your connection.', true);
                        } else if (event.error === 'no-speech') {
                            showStatus('No speech detected. Please try again.', true);
                        } else if (event.error === 'not-allowed') {
                            showStatus('Microphone access denied. Please allow microphone access.', true);
                        } else {
                            showStatus('Error occurred: ' + event.error, true);
                        }
                        
                        resetMicButton();
                        micButton.removeAttribute('data-processing');
                        
                        // On certain errors, we want to stop listening on mobile
                        if (isMobile && ['network', 'service-not-allowed', 'not-allowed'].includes(event.error)) {
                            recognition._isListening = false;
                        }
                    };
                    
                    recognition.onend = () => {
                        console.log('Speech recognition ended');
                        // On mobile, we need to restart recognition manually since continuous mode is disabled
                        if (isMobile && recognition._isListening) {
                            // Start recognition again after a small delay to avoid rapid restarts
                            setTimeout(() => {
                                try {
                                    // Clear the last recognized text when restarting to avoid repetition
                                    if (recognition._textBuffer && recognition._textBuffer.length > 3) {
                                        // Keep only the last 3 recognized texts to prevent repetition
                                        recognition._textBuffer = recognition._textBuffer.slice(-3);
                                        recognition._lastRecognizedText = recognition._textBuffer.join(' ');
                                    }
                                    
                                    recognition.start();
                                    console.log('Recognition restarted automatically on mobile');
                                } catch (e) {
                                    // If there's an error restarting (already started or other issue)
                                    console.error('Error restarting recognition:', e);
                                    recognition._isListening = false;
                                    resetMicButton();
                                    showStatus('Recording stopped');
                                    micButton.removeAttribute('data-processing');
                                }
                            }, recognition._restartDelay || 300);
                        } else {
                            resetMicButton();
                            showStatus('Recording stopped');
                            micButton.removeAttribute('data-processing');
                        }
                    };
                }
                
                // Start the recognition
                try {
                    console.log('Attempting to start speech recognition');
                    recognition._isListening = true;
                    recognition.start();
                    console.log('Speech recognition started successfully');
                } catch (e) {
                    console.error('Error starting recognition:', e);
                    showStatus('Error starting speech recognition. Please try again.', true);
                    recognition._isListening = false;
                    resetMicButton();
                    micButton.removeAttribute('data-processing');
                }
            })
            .catch(function(err) {
                console.error('Error accessing microphone:', err);
                showStatus('Microphone access denied. Please allow microphone access in your browser settings.', true);
                resetMicButton();
                micButton.removeAttribute('data-processing');
            });
    }, isMobile ? 400 : 250)); // Use longer debounce on mobile to prevent accidental double-taps
    
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
        
        // If speech synthesis is already active, toggle pause/resume
        if (speechSynthesisActive && currentSpeech) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                speakButton.innerHTML = '<i class="fas fa-pause"></i>Pause';
                showStatus('Resuming speech...');
            } else {
                window.speechSynthesis.pause();
                speakButton.innerHTML = '<i class="fas fa-play"></i>Resume';
                showStatus('Speech paused');
            }
            speakButton.removeAttribute('data-processing');
            return;
        }
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        speechSynthesisActive = true;
        
        // Load user settings for speech
        const userSettings = loadUserSettings();
        
        const speech = new SpeechSynthesisUtterance(text);
        currentSpeech = speech;
        
        // Get available voices and set based on user preference
        let voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to find the selected voice or a nice English voice
            if (userSettings.selectedVoice) {
                const savedVoice = voices.find(voice => voice.name === userSettings.selectedVoice);
                if (savedVoice) {
                    speech.voice = savedVoice;
                }
            }
            
            // If no saved voice or not found, use a default good voice
            if (!speech.voice) {
                const preferredVoice = voices.find(voice => 
                    voice.lang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Premium'))
                ) || voices[0];
                speech.voice = preferredVoice;
            }
        }
        
        // Apply user settings for rate and pitch
        speech.rate = userSettings.voiceSpeed || 1.0;
        speech.pitch = userSettings.voicePitch || 1.0;
        
        speech.onstart = () => {
            showStatus('Speaking...');
            speakButton.innerHTML = '<i class="fas fa-pause"></i>Pause';
            speakButton.style.animation = 'pulse 1.5s infinite alternate';
        };
        
        speech.onend = () => {
            speakButton.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
            speakButton.style.animation = 'none';
            speakButton.removeAttribute('data-processing');
            speechSynthesisActive = false;
            currentSpeech = null;
            showStatus('Finished speaking');
        };
        
        speech.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            showStatus('Error during speech synthesis', true);
            speakButton.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
            speakButton.style.animation = 'none';
            speakButton.removeAttribute('data-processing');
            speechSynthesisActive = false;
            currentSpeech = null;
        };
        
        // Mobile browsers and Safari have issues with longer text
        // Split into smaller chunks if text is very long
        if ((isMobile || /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) && text.length > 150) {
            // Use smarter sentence splitting to maintain context
            const sentences = text.split(/([.!?]+\s)/g).reduce((result, part, i, arr) => {
                if (i % 2 === 0) {
                    // Even indices are the text parts
                    if (i + 1 < arr.length) {
                        // Append the punctuation to keep it with the sentence
                        result.push(part + arr[i + 1]);
                    } else {
                        // Last part might not have punctuation
                        result.push(part);
                    }
                }
                return result;
            }, []).filter(s => s.trim().length > 0);
            
            // Group sentences into chunks of reasonable size
            const chunks = [];
            let currentChunk = '';
            
            for (const sentence of sentences) {
                if (currentChunk.length + sentence.length < 150) {
                    currentChunk += sentence;
                } else {
                    if (currentChunk) {
                        chunks.push(currentChunk);
                    }
                    currentChunk = sentence;
                }
            }
            if (currentChunk) {
                chunks.push(currentChunk);
            }
            
            // Speak each chunk in order
            (function speakChunk(index) {
                if (index >= chunks.length) {
                    speechSynthesisActive = false;
                    speakButton.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
                    speakButton.style.animation = 'none';
                    speakButton.removeAttribute('data-processing');
                    return;
                }
                
                const chunk = chunks[index];
                const chunkSpeech = new SpeechSynthesisUtterance(chunk);
                
                // Copy settings to the chunk speech
                chunkSpeech.voice = speech.voice;
                chunkSpeech.rate = speech.rate;
                chunkSpeech.pitch = speech.pitch;
                
                chunkSpeech.onend = () => {
                    // Speak the next chunk after a short delay
                    setTimeout(() => {
                        speakChunk(index + 1);
                    }, 100);
                };
                
                chunkSpeech.onerror = (event) => {
                    console.error('Speech synthesis error:', event);
                    // Skip to next chunk on error
                    speakChunk(index + 1);
                };
                
                // Start speaking the chunk
                window.speechSynthesis.speak(chunkSpeech);
            })(0);
        } else {
            // For shorter text, just speak it directly
            window.speechSynthesis.speak(speech);
        }
        
        // Fix for Safari/iOS speech synthesis
        const fixSpeechSynthesis = () => {
            if (window.speechSynthesis) {
                // Force the voices to load properly in Safari
                window.speechSynthesis.getVoices();
                
                // Resume any paused speech on visibility change
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden && window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    }
                });
                
                // iOS Safari bug workaround - speech can stop unexpectedly
                if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
                    // Periodically reset the synthesis if it gets stuck
                    setInterval(() => {
                        if (speechSynthesisActive && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                            window.speechSynthesis.pause();
                            setTimeout(() => {
                                window.speechSynthesis.resume();
                            }, 100);
                        }
                    }, 5000); // Check every 5 seconds
                }
            }
        };
        
        fixSpeechSynthesis();
    }, isMobile ? 500 : 250)); // Longer debounce for mobile to prevent accidental repeats    // Settings panel functionality
    document.getElementById('settings-toggle').addEventListener('click', function() {
        const settingsPanel = document.getElementById('settings-panel');
        const overlay = document.getElementById('settings-overlay');
        
        settingsPanel.classList.add('active');
        overlay.classList.add('active');
        
        // Initialize settings controls with current values
        document.getElementById('voice-speed').value = userSettings.voiceSpeed;
        document.getElementById('voice-speed').nextElementSibling.textContent = userSettings.voiceSpeed;
        document.getElementById('voice-pitch').value = userSettings.voicePitch;
        document.getElementById('voice-pitch').nextElementSibling.textContent = userSettings.voicePitch;
        
        // Populate voice options if needed
        const voiceSelect = document.getElementById('voice-select');
        if (voiceSelect.options.length <= 1) {
            populateVoiceList();
        }
        
        // Set selected voice if available
        if (userSettings.selectedVoice) {
            for (let i = 0; i < voiceSelect.options.length; i++) {
                if (voiceSelect.options[i].value === userSettings.selectedVoice) {
                    voiceSelect.selectedIndex = i;
                    break;
                }
            }
        }
    });    // Close settings panel
    document.getElementById('close-settings').addEventListener('click', function() {
        const settingsPanel = document.getElementById('settings-panel');
        const overlay = document.getElementById('settings-overlay');
        
        // Add animation to the close button
        this.style.transform = 'rotate(90deg)';
        
        // Add closing animation class
        settingsPanel.classList.add('closing');
        settingsPanel.classList.remove('active');
        
        // After animation completes, hide overlay
        setTimeout(() => {
            overlay.classList.remove('active');
            settingsPanel.classList.remove('closing');
            
            // Reset the transform after the panel is closed
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        }, 300);
    });    // Close settings panel when clicking outside
    document.addEventListener('click', function(event) {
        const settingsPanel = document.getElementById('settings-panel');
        const settingsToggle = document.getElementById('settings-toggle');
        const overlay = document.getElementById('settings-overlay');
        
        // Check if settings panel is active and click is outside the panel and not on the toggle button
        if (settingsPanel.classList.contains('active') && 
            !settingsPanel.contains(event.target) && 
            event.target !== settingsToggle && 
            !settingsToggle.contains(event.target)) {
            
            // Add closing animation
            settingsPanel.classList.add('closing');
            settingsPanel.classList.remove('active');
            
            // After animation completes, hide overlay
            setTimeout(() => {
                overlay.classList.remove('active');
                settingsPanel.classList.remove('closing');
            }, 300);
        }
    });
    
    // Prevent closing when clicking inside the panel
    document.getElementById('settings-panel').addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    // Voice speed slider
    document.getElementById('voice-speed').addEventListener('input', function() {
        const value = parseFloat(this.value);
        this.nextElementSibling.textContent = value.toFixed(1);
        userSettings.voiceSpeed = value;
        saveUserSettings();
    });
    
    // Voice pitch slider
    document.getElementById('voice-pitch').addEventListener('input', function() {
        const value = parseFloat(this.value);
        this.nextElementSibling.textContent = value.toFixed(1);
        userSettings.voicePitch = value;
        saveUserSettings();
    });
    
    // Voice selection
    document.getElementById('voice-select').addEventListener('change', function() {
        userSettings.selectedVoice = this.value;
        saveUserSettings();
    });
    
    // Dark mode toggle
    document.getElementById('dark-mode-toggle').addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            userSettings.darkMode = true;
        } else {
            document.body.classList.remove('dark-mode');
            userSettings.darkMode = false;
        }
        saveUserSettings();
    });
    
    // Function to populate voice dropdown
    function populateVoiceList() {
        const voiceSelect = document.getElementById('voice-select');
        let voices = [];
        
        // Safari needs an onvoiceschanged event
        function loadVoices() {
            voices = speechSynthesis.getVoices();
            
            // Clear all options except the default
            while (voiceSelect.options.length > 1) {
                voiceSelect.remove(1);
            }
            
            // Add voices to the select box
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            
            // Set the selected voice if it was previously set
            if (userSettings.selectedVoice) {
                for (let i = 0; i < voiceSelect.options.length; i++) {
                    if (voiceSelect.options[i].value === userSettings.selectedVoice) {
                        voiceSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
        
        // Chrome loads voices asynchronously
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        
        // Initial load attempt for other browsers
        loadVoices();
    }
    
    // Initial population of voice list
    populateVoiceList();
    
    // Event listener for voice selection change
    document.getElementById('voice-select').addEventListener('change', function() {
        const selectedVoice = this.value;
        userSettings.selectedVoice = selectedVoice;
        
        // Save user settings
        saveUserSettings();
        
        // Update the current speech voice if speaking
        if (currentSpeech) {
            const voices = speechSynthesis.getVoices();
            const newVoice = voices.find(voice => voice.name === selectedVoice);
            if (newVoice) {
                currentSpeech.voice = newVoice;
            }
        }
        
        showStatus('Voice changed to ' + selectedVoice);
    });
      // Function to reset settings to default
    document.getElementById('reset-settings').addEventListener('click', function() {
        // Add button animation
        animateButton(this);
        
        // Reset user settings object
        userSettings = {
            voiceSpeed: 1.0,
            voicePitch: 1.0,
            selectedVoice: '',
            darkMode: false
        };
        
        // Save the default settings to localStorage
        saveUserSettings();
        
        // Reset UI elements
        document.getElementById('dark-mode-toggle').checked = false;
        document.body.classList.remove('dark-mode');
        
        const voiceSelect = document.getElementById('voice-select');
        voiceSelect.selectedIndex = 0;
        
        // Reset sliders
        document.getElementById('voice-speed').value = 1.0;
        document.getElementById('voice-speed').nextElementSibling.textContent = "1.0";
        document.getElementById('voice-pitch').value = 1.0;
        document.getElementById('voice-pitch').nextElementSibling.textContent = "1.0";
        
        // Show default status message
        showStatus('Settings reset to default');
    });
    
    // Add CSS for optimized waiting state
    const style = document.createElement('style');
    style.textContent = `
        .waiting {
            opacity: 0.7;
            pointer-events: none;
        }
        
        .touch-active {
            opacity: 0.7;
            transform: scale(0.98);
        }
        
        .hardware-accelerated button, 
        .hardware-accelerated .dialog-content,
        .hardware-accelerated .animated-message {
            will-change: transform, opacity;
            transform: translateZ(0);
        }
        
        @media (max-width: 480px) {
            #app {
                box-shadow: 0 5px 15px rgba(36, 99, 235, 0.1);
                padding: 20px 15px;
            }
            
            textarea {
                height: 140px;
                padding: 10px;
            }
            
            button {
                padding: 10px 15px;
                font-size: 14px;
            }
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
    
    // Add CSS class for browsers that support hardware acceleration
    if ('willChange' in document.body.style) {
        document.body.classList.add('hardware-accelerated');
    }
      // Allow clicking on the overlay to close settings
    document.getElementById('settings-overlay').addEventListener('click', function() {
        const settingsPanel = document.getElementById('settings-panel');
        const closeBtn = document.getElementById('close-settings');
        
        // Add rotation effect to close button for visual consistency
        closeBtn.style.transform = 'rotate(90deg)';
        
        // Add closing animation
        settingsPanel.classList.add('closing');
        settingsPanel.classList.remove('active');
        
        // After animation completes, hide overlay
        setTimeout(() => {
            this.classList.remove('active');
            settingsPanel.classList.remove('closing');
            
            setTimeout(() => {
                closeBtn.style.transform = '';
            }, 200);
        }, 300);
    });
    
    // Calculate the appropriate width for the settings panel based on the main card
    function updateSettingsPanelSize() {
        const app = document.getElementById('app');
        const settingsPanel = document.getElementById('settings-panel');
        
        // Match width to app width, but with a maximum
        const appWidth = app.offsetWidth;
        const maxWidth = Math.min(appWidth, 450); // Maximum width of 450px
        
        settingsPanel.style.maxWidth = maxWidth + 'px';
        settingsPanel.style.width = '90%';
    }
    
    // Update the settings panel size on window resize
    window.addEventListener('resize', updateSettingsPanelSize);
    
    // Initial size calculation
    updateSettingsPanelSize();
    
    // Clear button functionality
    const clearButton = document.getElementById('clear');
    const clearConfirmation = document.getElementById('clear-confirmation');
    const confirmClearButton = document.getElementById('confirm-clear');
    const cancelClearButton = document.getElementById('cancel-clear');
    
    // Show confirmation dialog when clear button is clicked
    clearButton.addEventListener('click', function() {
        animateButton(this);
        clearConfirmation.classList.add('active');
    });
    
    // Cancel clear operation
    cancelClearButton.addEventListener('click', function() {
        animateButton(this);
        clearConfirmation.classList.remove('active');
    });
    
    // Confirm clear operation
    confirmClearButton.addEventListener('click', function() {
        animateButton(this);
        textArea.value = '';
        clearConfirmation.classList.remove('active');
        showAnimatedMessage('Text cleared successfully', 'trash-alt');
    });
    
    // Save button functionality
    const saveButton = document.getElementById('save');
    const filenameDialog = document.getElementById('filename-dialog');
    const confirmSaveButton = document.getElementById('confirm-save');
    const cancelSaveButton = document.getElementById('cancel-save');
    const filenameInput = document.getElementById('filename-input');
    
    // Show filename input dialog when save button is clicked
    saveButton.addEventListener('click', function() {
        animateButton(this);
        
        if (!textArea.value.trim()) {
            showStatus('Nothing to save. Please add some text first.', true);
            return;
        }
        
        filenameDialog.classList.add('active');
        filenameInput.focus();
    });
    
    // Cancel save operation
    cancelSaveButton.addEventListener('click', function() {
        animateButton(this);
        filenameDialog.classList.remove('active');
    });
    
    // Confirm save operation
    confirmSaveButton.addEventListener('click', function() {
        animateButton(this);
        
        const filename = filenameInput.value.trim() || 'speechify_text';
        const text = textArea.value;
        
        // Create a blob and download it
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.txt`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        filenameDialog.classList.remove('active');
        showAnimatedMessage('Text saved successfully', 'save');
    });
});

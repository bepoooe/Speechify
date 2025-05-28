// Main script file for Speechify app
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const textArea = document.getElementById('text');
    const statusMessage = document.getElementById('status-message');
    let recognition;
    let speechSynthesisActive = false;
    let currentSpeech = null;
    
    // Check browser compatibility for speech recognition at startup
    console.log("Checking browser compatibility for speech recognition");
    const browserWarning = document.getElementById('browser-warning');
    
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
        console.error('Speech Recognition API not supported in this browser');
        browserWarning.style.display = 'block';
        setTimeout(() => {
            showStatus('Speech Recognition is not supported in your browser. Please use Chrome or Edge.', true);
        }, 1000);
    } else {
        console.log('Speech Recognition API is supported in this browser');
        browserWarning.style.display = 'none';
        // Try to initialize speech recognition to make sure it actually works
        try {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            const testRecognition = new SpeechRecognitionAPI();
            console.log('Successfully created speech recognition instance:', testRecognition);
            // Don't start it, just make sure we can create it
        } catch (e) {
            console.error('Error creating speech recognition instance:', e);
            browserWarning.style.display = 'block';
            setTimeout(() => {
                showStatus('Error initializing speech recognition: ' + e.message, true);
            }, 1000);
        }
    }
    
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
        console.log('Status message:', message, isError ? '(error)' : '');
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
    
    // Function to test speech recognition and verify it's working
    function testSpeechRecognition() {
        // Only run this test if speech recognition should be supported
        if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
            showStatus('Speech Recognition is not supported in your browser. Please use Chrome or Edge.', true);
            return;
        }
        
        console.log('Running speech recognition test...');
        
        // First, request microphone permissions
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                // Permission granted, stop the tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
                
                // Show a status message
                showStatus('Microphone access granted. Testing speech recognition...');
                
                // Try to initialize a test recognition instance
                try {
                    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
                    const testRecognition = new SpeechRecognitionAPI();
                    
                    // Configure it
                    testRecognition.lang = 'en-US';
                    testRecognition.continuous = false;
                    testRecognition.interimResults = true;
                    testRecognition.maxAlternatives = 1;
                    
                    // Set up event handlers
                    testRecognition.onstart = () => {
                        console.log('Test recognition started');
                        showAnimatedMessage('Please speak now!', 'microphone', 10000);
                    };
                    
                    testRecognition.onresult = (event) => {
                        const lastResult = event.results[event.results.length - 1];
                        const transcript = lastResult[0].transcript.trim();
                        
                        console.log('Test recognition heard:', transcript);
                        
                        if (lastResult.isFinal) {
                            showStatus('Speech detected: "' + transcript + '"');
                            console.log('Final test result:', transcript);
                            
                            // Add a small text indicator to the textarea as confirmation
                            textArea.value = 'Test successful! Speech recognition heard: "' + transcript + '"\n\n' + 
                                            (textArea.value || '');
                            
                            // Add visual feedback to the button
                            const testButton = document.getElementById('test-speech');
                            testButton.style.background = '#10B981';
                            testButton.innerHTML = '<i class="fas fa-check"></i>Test Passed';
                            
                            // Reset the button after a few seconds
                            setTimeout(() => {
                                testButton.style.background = '#6366F1';
                                testButton.innerHTML = '<i class="fas fa-vial"></i>Test Mic';
                            }, 3000);
                        }
                    };
                    
                    testRecognition.onerror = (event) => {
                        console.error('Test recognition error:', event.error);
                        showStatus('Speech recognition test error: ' + event.error, true);
                        
                        // Update the button to indicate failure
                        const testButton = document.getElementById('test-speech');
                        testButton.style.background = '#EF4444';
                        testButton.innerHTML = '<i class="fas fa-times"></i>Test Failed';
                        
                        // Reset the button after a few seconds
                        setTimeout(() => {
                            testButton.style.background = '#6366F1';
                            testButton.innerHTML = '<i class="fas fa-vial"></i>Test Mic';
                        }, 3000);
                    };
                    
                    testRecognition.onend = () => {
                        console.log('Test recognition ended');
                    };
                    
                    // Start the test
                    testRecognition.start();
                    
                    // Stop it after a reasonable time
                    setTimeout(() => {
                        try {
                            testRecognition.stop();
                        } catch (e) {
                            console.log('Error stopping test recognition (probably already stopped):', e);
                        }
                    }, 8000);
                    
                } catch (e) {
                    console.error('Error initializing test recognition:', e);
                    showStatus('Error initializing speech recognition test: ' + e.message, true);
                }
            })
            .catch(function(err) {
                console.error('Error accessing microphone:', err);
                showStatus('Microphone access denied. Please allow microphone access in your browser settings.', true);
            });
    }
    
    // Add test button event listener if the button exists
    const testButton = document.getElementById('test-speech');
    if (testButton) {
        testButton.title = 'Test microphone and speech recognition';
        testButton.addEventListener('click', function() {
            animateButton(this);
            testSpeechRecognition();
        });
    }
    
    // Button animation helper
    function animateButton(button) {
        button.classList.remove('animate');
        void button.offsetWidth; // Trigger reflow
        button.classList.add('animate');
    }
    
    // Simple debounce function to prevent multiple rapid clicks
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Function to filter out noise in transcripts
    function isValidTranscript(transcript) {
        // Filter out very short transcripts (likely noise)
        if (transcript.length < 2) {
            return false;
        }
        
        // Filter out transcripts that are just single letters or numbers
        if (transcript.length === 1 && /[a-z0-9]/i.test(transcript)) {
            return false;
        }
        
        // Filter out common noise patterns or non-speech sounds
        const noisePatterns = [
            /^(um|uh|hmm|err)$/i,
            /^(sigh|cough|sneeze)$/i,
            /^(\*|\.|\,|\;|\:|\?)$/,
            /^(background noise|silence)$/i
        ];
        
        for (const pattern of noisePatterns) {
            if (pattern.test(transcript.trim())) {
                return false;
            }
        }
        
        return true;
    }
    
    // Clear button functionality with confirmation
    document.getElementById('clear').addEventListener('click', function() {
        animateButton(this);
        
        // Get dialog elements
        const confirmationDialog = document.getElementById('clear-confirmation');
        const confirmButton = document.getElementById('confirm-clear');
        const cancelButton = document.getElementById('cancel-clear');
        
        // Show dialog
        confirmationDialog.classList.add('active');
        
        // Set up button actions
        confirmButton.onclick = function() {
            textArea.value = '';
            confirmationDialog.classList.remove('active');
            showStatus('Text cleared');
        };
        
        cancelButton.onclick = function() {
            confirmationDialog.classList.remove('active');
        };
    });
    
    // Save button functionality
    document.getElementById('save').addEventListener('click', function() {
        animateButton(this);
        
        if (!textArea.value.trim()) {
            showStatus('Nothing to save. Please record or type some text first.', true);
            return;
        }
        
        // Get dialog elements
        const filenameDialog = document.getElementById('filename-dialog');
        const filenameInput = document.getElementById('filename-input');
        const confirmButton = document.getElementById('confirm-save');
        const cancelButton = document.getElementById('cancel-save');
        
        // Set initial value
        filenameInput.value = 'speechify_text';
        
        // Show dialog
        filenameDialog.classList.add('active');
        
        // Focus the input field
        setTimeout(() => filenameInput.focus(), 100);
        
        // Set up button actions
        confirmButton.onclick = function() {
            let filename = filenameInput.value.trim() || 'speechify_text';
            if (!filename.endsWith('.txt')) {
                filename += '.txt';
            }
            
            // Create blob and download link
            const blob = new Blob([textArea.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            filenameDialog.classList.remove('active');
            showStatus('File saved as ' + filename);
            showAnimatedMessage('File saved successfully!', 'save');
        };
        
        cancelButton.onclick = function() {
            filenameDialog.classList.remove('active');
        };
    });
    
    // Function to show animated message
    function showAnimatedMessage(message, icon = 'check-circle', duration = 2000) {
        const messageElement = document.getElementById('success-message');
        if (messageElement) {
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
    }
    
    // Function to reset the microphone button
    function resetMicButton() {
        const micButton = document.getElementById('activate-mic');
        micButton.innerHTML = '<i class="fas fa-microphone"></i>Record';
        micButton.style.background = 'var(--primary)';
        micButton.style.animation = 'none';
        micButton.removeAttribute('data-processing');
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
        
        // Log that we created the recognition instance
        console.log('Speech recognition instance created successfully');
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
        
        // Prevent button spamming
        if (speakButton.getAttribute('data-processing') === 'true') {
            return;
        }
        
        animateButton(speakButton);
        speakButton.setAttribute('data-processing', 'true');
        
        // First check if there's text to speak
        const textToSpeak = textArea.value.trim();
        if (!textToSpeak) {
            showStatus('Nothing to speak. Please record or type some text first.', true);
            speakButton.removeAttribute('data-processing');
            return;
        }
        
        // Check if speech synthesis is supported
        if (!('speechSynthesis' in window)) {
            showStatus('Text-to-speech is not supported in your browser.', true);
            speakButton.removeAttribute('data-processing');
            return;
        }
        
        // Stop any currently running speech
        if (speechSynthesisActive) {
            window.speechSynthesis.cancel();
            speechSynthesisActive = false;
            speakButton.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
            speakButton.style.background = 'var(--success)';
            speakButton.removeAttribute('data-processing');
            return;
        }
        
        try {
            // Change button appearance to stop
            speakButton.innerHTML = '<i class="fas fa-stop"></i>Stop';
            speakButton.style.background = 'var(--danger)';
            
            // Create utterance
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            // Set utterance properties from settings
            utterance.rate = userSettings.voiceSpeed;
            utterance.pitch = userSettings.voicePitch;
            
            // Set selected voice if saved in settings
            if (userSettings.selectedVoice) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(voice => voice.voiceURI === userSettings.selectedVoice);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }
            
            // Set up event handlers
            utterance.onstart = () => {
                speechSynthesisActive = true;
                showStatus('Speaking text...');
                currentSpeech = utterance;
            };
            
            utterance.onend = () => {
                speechSynthesisActive = false;
                speakButton.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
                speakButton.style.background = 'var(--success)';
                speakButton.removeAttribute('data-processing');
                currentSpeech = null;
                showStatus('Finished speaking');
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                showStatus('Error while speaking: ' + (event.error || 'Unknown error'), true);
                speechSynthesisActive = false;
                speakButton.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
                speakButton.style.background = 'var(--success)';
                speakButton.removeAttribute('data-processing');
                currentSpeech = null;
            };
            
            // Start speaking
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Error using speech synthesis:', error);
            showStatus('Error using text-to-speech: ' + error.message, true);
            speakButton.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
            speakButton.style.background = 'var(--success)';
            speakButton.removeAttribute('data-processing');
        }
    }, isMobile ? 300 : 200));
    
    // Settings panel functionality
    const settingsButton = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const closeSettingsButton = document.getElementById('close-settings');
    
    settingsButton.addEventListener('click', function() {
        settingsPanel.classList.add('active');
        settingsOverlay.classList.add('active');
        
        // Load current settings into UI
        document.getElementById('voice-speed').value = userSettings.voiceSpeed;
        document.getElementById('voice-speed').nextElementSibling.textContent = userSettings.voiceSpeed;
        
        document.getElementById('voice-pitch').value = userSettings.voicePitch;
        document.getElementById('voice-pitch').nextElementSibling.textContent = userSettings.voicePitch;
        
        // Populate voice selection
        populateVoiceOptions();
    });
    
    function closeSettingsPanel() {
        settingsPanel.classList.add('closing');
        settingsOverlay.classList.remove('active');
        
        setTimeout(() => {
            settingsPanel.classList.remove('active', 'closing');
        }, 300);
    }
    
    closeSettingsButton.addEventListener('click', closeSettingsPanel);
    settingsOverlay.addEventListener('click', closeSettingsPanel);
    
    // Voice Speed Control
    document.getElementById('voice-speed').addEventListener('input', function() {
        const value = parseFloat(this.value);
        this.nextElementSibling.textContent = value.toFixed(1);
        userSettings.voiceSpeed = value;
        saveUserSettings();
    });
    
    // Voice Pitch Control
    document.getElementById('voice-pitch').addEventListener('input', function() {
        const value = parseFloat(this.value);
        this.nextElementSibling.textContent = value.toFixed(1);
        userSettings.voicePitch = value;
        saveUserSettings();
    });
    
    // Dark Mode Toggle
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
    
    // Reset Settings Button
    document.getElementById('reset-settings').addEventListener('click', function() {
        // Reset to defaults
        userSettings = {
            voiceSpeed: 1.0,
            voicePitch: 1.0,
            selectedVoice: '',
            darkMode: false
        };
        
        // Update UI
        document.getElementById('voice-speed').value = 1.0;
        document.getElementById('voice-speed').nextElementSibling.textContent = '1.0';
        
        document.getElementById('voice-pitch').value = 1.0;
        document.getElementById('voice-pitch').nextElementSibling.textContent = '1.0';
        
        document.getElementById('voice-select').value = '';
        
        document.getElementById('dark-mode-toggle').checked = false;
        document.body.classList.remove('dark-mode');
        
        // Save reset settings
        saveUserSettings();
        
        // Show confirmation
        showStatus('Settings reset to defaults');
    });
    
    // Populate voice select dropdown
    function populateVoiceOptions() {
        const voiceSelect = document.getElementById('voice-select');
        let voices = [];
        
        // Get voices - might be async on some browsers
        function loadVoices() {
            voices = window.speechSynthesis.getVoices();
            
            // Clear existing options except the default
            while (voiceSelect.options.length > 1) {
                voiceSelect.options.remove(1);
            }
            
            // Add voice options
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.voiceURI;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
                
                // Select the saved voice if it exists
                if (voice.voiceURI === userSettings.selectedVoice) {
                    voiceSelect.value = voice.voiceURI;
                }
            });
        }
        
        // Handle voice list loading
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        
        // Initial load
        loadVoices();
        
        // Voice Selection Change
        voiceSelect.addEventListener('change', function() {
            userSettings.selectedVoice = this.value;
            saveUserSettings();
        });
    }
    
    // Create debug toggle to show/hide debug button
    let debugKeyTimeout;
    document.addEventListener('keydown', function(event) {
        // Check for Shift+D
        if (event.shiftKey && event.key === 'D') {
            clearTimeout(debugKeyTimeout);
            debugKeyTimeout = setTimeout(() => {
                if (window.SpeechifyDebug && window.SpeechifyDebug.toggleDebugPanel) {
                    window.SpeechifyDebug.toggleDebugPanel();
                } else {
                    console.log('Debug panel not available');
                }
            }, 100);
        }
    });
    
    // Initialize debug panel if available
    if (window.SpeechifyDebug && window.SpeechifyDebug.initialize) {
        window.SpeechifyDebug.initialize();
    }
});

// Main script file for Speechify app
document.addEventListener('DOMContentLoaded', function() {    // Initialize variables
    const textArea = document.getElementById('text');
    const statusMessage = document.getElementById('status-message');
    let recognition;    let speechSynthesisActive = false;
    let currentSpeech = null;

    // Check browser compatibility for speech recognition at startup
    console.log("Checking browser compatibility for speech recognition");
    const browserWarning = document.getElementById('browser-warning');

    // Global variable to track speech recognition support
    let speechRecognitionSupported = false;
    let SpeechRecognitionAPI = null;

    if ('SpeechRecognition' in window) {
        SpeechRecognitionAPI = window.SpeechRecognition;
        speechRecognitionSupported = true;
        console.log('Using standard SpeechRecognition API');
    } else if ('webkitSpeechRecognition' in window) {
        SpeechRecognitionAPI = window.webkitSpeechRecognition;
        speechRecognitionSupported = true;
        console.log('Using webkit prefixed SpeechRecognition API');
    } else {
        console.error('Speech Recognition API not supported in this browser');
        speechRecognitionSupported = false;
    }

    if (!speechRecognitionSupported) {
        browserWarning.style.display = 'block';
        setTimeout(() => {
            showStatus('Speech Recognition is not supported in your browser. Please use Chrome or Edge.', true);
        }, 1000);
    } else {
        console.log('Speech Recognition API is supported in this browser');
        browserWarning.style.display = 'none';
        // Try to initialize speech recognition to make sure it actually works
        try {
            const testRecognition = new SpeechRecognitionAPI();
            console.log('Successfully created speech recognition instance:', testRecognition);
            // Don't start it, just make sure we can create it
        } catch (e) {
            console.error('Error creating speech recognition instance:', e);
            speechRecognitionSupported = false;
            browserWarning.style.display = 'block';
            setTimeout(() => {
                showStatus('Error initializing speech recognition: ' + e.message, true);
            }, 1000);
        }
    }    // Detect if device is mobile
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Mobile-specific global protection
    let mobileLastSpeechTime = 0;
    let mobileRecentSpeeches = [];
      // Mobile-specific: Add global speech synthesis monitoring
    if (isMobile) {
        console.log('Mobile device detected - enabling enhanced speech protection');        // Force cleanup function for mobile devices
        window.forceSpeechCleanup = () => {
            console.log('Mobile: Force cleanup initiated');
            try {
                window.speechSynthesis.cancel();
                speechSynthesisActive = false;
                currentSpeech = null;
                
                // Clear mobile tracking
                mobileLastSpeechTime = 0;
                mobileRecentSpeeches = [];
                
                const speakBtn = document.getElementById('speak');
                if (speakBtn) {
                    speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
                    speakBtn.style.background = 'var(--success)';
                    speakBtn.removeAttribute('data-processing');
                    speakBtn.removeAttribute('data-mobile-blocked');
                }
                console.log('Mobile: Force cleanup completed');
            } catch (e) {
                console.error('Mobile: Error during force cleanup:', e);
            }
        };
        
        // Monitor for stuck speech synthesis on mobile
        setInterval(() => {
            if (speechSynthesisActive && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                console.log('Mobile: Detected stuck speech synthesis, cleaning up');
                window.forceSpeechCleanup();
            }
        }, 1000); // Check every second on mobile
        
        // Add visibility change handler for mobile to stop speech when app is backgrounded
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && speechSynthesisActive) {
                console.log('Mobile: App backgrounded, stopping speech synthesis');
                window.forceSpeechCleanup();
            }
        });
        
        // Add touch event handlers to detect when user might be frantically tapping
        let tapCount = 0;
        let tapTimer = null;
        
        document.addEventListener('touchstart', () => {
            tapCount++;
            
            if (tapTimer) {
                clearTimeout(tapTimer);
            }
            
            tapTimer = setTimeout(() => {
                if (tapCount > 3) { // If more than 3 taps in a short period
                    console.log('Mobile: Rapid tapping detected, performing cleanup');
                    window.forceSpeechCleanup();
                }
                tapCount = 0;
            }, 1000);
        });
    }    // Add a class to body for mobile-specific styling if needed
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        // Add mobile-specific styles for protected states
        const style = document.createElement('style');
        style.textContent = `
            .mobile-device #speak[data-mobile-blocked] {
                opacity: 0.6 !important;
                cursor: not-allowed !important;
                position: relative;
            }
            
            .mobile-device #speak[data-mobile-blocked]::after {
                content: "⏳";
                position: absolute;
                top: 50%;
                right: 8px;
                transform: translateY(-50%);
                font-size: 14px;
            }
            
            .mobile-device #speak[data-processing] {
                animation: mobileProcessing 1s infinite alternate;
            }
            
            @keyframes mobileProcessing {
                0% { box-shadow: 0 0 5px rgba(220, 38, 38, 0.3); }
                100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.7); }
            }
        `;
        document.head.appendChild(style);
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
        // Check if speech recognition is supported
        if (!speechRecognitionSupported || !SpeechRecognitionAPI) {
            console.error('Speech Recognition API not supported in this browser');
            showStatus('Speech Recognition is not supported in your browser. Please use Chrome or Edge.', true);
            return null;
        }

        try {
            const recognitionInstance = new SpeechRecognitionAPI();

            // Configure recognition settings
            recognitionInstance.lang = 'en-US';
            recognitionInstance.continuous = true; // Use continuous mode for better experience
            recognitionInstance.interimResults = true;
            recognitionInstance.maxAlternatives = 1;

            // Initialize tracking variables
            recognitionInstance._isListening = false;
            recognitionInstance._lastRecognizedText = '';
            recognitionInstance._userStopped = false;

            // Log that we created the recognition instance
            console.log('Speech recognition instance created successfully');
            return recognitionInstance;
        } catch (e) {
            console.error('Error creating speech recognition instance:', e);
            showStatus('Error creating speech recognition: ' + e.message, true);
            return null;
        }
    }

    // Function to handle speech recognition results
    function handleRecognitionResults(event) {
        console.log('Processing speech recognition results', event);

        // Get the current transcript from the most recent result
        const currentResult = event.results[event.results.length - 1];

        // Only process final results to avoid duplicates
        if (currentResult.isFinal) {
            const transcript = currentResult[0].transcript.trim();
            console.log('Final transcript:', transcript);

            // Only add if transcript is not empty and different from last recognized text
            if (transcript && transcript !== recognition._lastRecognizedText) {
                console.log('Adding transcript to textarea:', transcript);

                // Append text with space if needed
                if (textArea.value && !textArea.value.endsWith(' ')) {
                    textArea.value += ' ';
                }
                textArea.value += transcript;

                // Update last recognized text
                recognition._lastRecognizedText = transcript;

                // Add a subtle animation to the textarea when new text appears
                textArea.style.animation = 'none';
                void textArea.offsetWidth; // Force reflow
                textArea.style.animation = 'scaleIn 0.3s ease';

                // Show status
                showStatus('Speech recognized: "' + transcript + '"');
            } else {
                console.log('Skipping empty or duplicate transcript');
            }
        } else {
            // Show interim results in status
            const transcript = currentResult[0].transcript.trim();
            if (transcript) {
                showStatus('Listening: "' + transcript + '"...');
            }
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
        if (!speechRecognitionSupported) {
            showStatus('Speech Recognition is not supported in your browser. Please use Chrome or Edge.', true);
            micButton.removeAttribute('data-processing');
            return;
        }

        // If recognition is already active, stop it
        if (recognition && recognition._isListening) {
            console.log('Stopping active speech recognition');
            recognition._isListening = false;
            recognition._userStopped = true; // Flag to indicate user manually stopped
            try {
                recognition.stop();
            } catch (e) {
                console.error('Error stopping recognition:', e);
                resetMicButton();
                showStatus('Recording stopped');
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
                        recognition._isListening = true;
                        showStatus('Listening... Speak now!');
                        micButton.innerHTML = '<i class="fas fa-stop"></i>Stop';
                        micButton.style.background = 'var(--danger)';
                        micButton.style.animation = 'blink 1.5s infinite';
                        micButton.removeAttribute('data-processing');
                    };

                    recognition.onresult = function(event) {
                        console.log('Speech recognition result received', event);
                        handleRecognitionResults(event);
                    };

                    recognition.onerror = (event) => {
                        console.error('Speech recognition error:', event.error);
                        recognition._isListening = false;

                        // Handle different error types
                        if (event.error === 'aborted') {
                            showStatus('Recognition stopped', false);
                        } else if (event.error === 'network') {
                            showStatus('Network error. Check your connection.', true);
                        } else if (event.error === 'no-speech') {
                            showStatus('No speech detected. Try speaking louder or closer to the microphone.', true);
                        } else if (event.error === 'not-allowed') {
                            showStatus('Microphone access denied. Please allow microphone access.', true);
                        } else {
                            showStatus('Error occurred: ' + event.error, true);
                        }

                        resetMicButton();
                        micButton.removeAttribute('data-processing');
                    };

                    recognition.onend = () => {
                        console.log('Speech recognition ended');
                        recognition._isListening = false;
                        resetMicButton();

                        // Only show "stopped" message if user explicitly stopped it
                        if (!recognition._userStopped) {
                            showStatus('Recording ended. Click Record to start again.');
                        } else {
                            showStatus('Recording stopped');
                            recognition._userStopped = false; // Reset flag
                        }
                        micButton.removeAttribute('data-processing');
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
    }, 300)); // Same debounce time for all devices    // Function to convert text to speech - Completely separate mobile and PC handling
    document.getElementById('speak').addEventListener('click', debounce(function() {
        const speakButton = this;

        if (isMobile) {
            // MOBILE-ONLY HANDLER: Aggressive protection against repetition
            handleMobileSpeech(speakButton);
        } else {
            // PC-ONLY HANDLER: Standard behavior
            handleDesktopSpeech(speakButton);
        }        // Mobile speech handler with maximum protection
        function handleMobileSpeech(button) {
            console.log('Mobile: Speech button clicked');
            
            const now = Date.now();
            const textToSpeak = textArea.value.trim();
              // Advanced mobile protection: Check for recent identical speech requests
            if (now - mobileLastSpeechTime < 3000) { // 3 second minimum interval
                console.log('Mobile: Too soon since last speech, ignoring');
                showStatus('Please wait before speaking again (mobile protection)');
                // Add visual feedback
                button.style.opacity = '0.5';
                setTimeout(() => {
                    button.style.opacity = '1';
                }, 1000);
                return;
            }
            
            // Check for duplicate text in recent speeches
            const isDuplicate = mobileRecentSpeeches.some(recent => 
                recent.text === textToSpeak && (now - recent.time) < 10000 // 10 seconds
            );
            
            if (isDuplicate) {
                console.log('Mobile: Duplicate speech detected, ignoring');
                showStatus('Same text was recently spoken (mobile protection)');
                // Add visual feedback
                button.style.opacity = '0.5';
                setTimeout(() => {
                    button.style.opacity = '1';
                }, 1000);
                return;
            }
            
            // Multiple layers of protection
            if (button.hasAttribute('data-mobile-blocked')) {
                console.log('Mobile: Button is blocked, ignoring click');
                return;
            }
            
            if (button.hasAttribute('data-processing')) {
                console.log('Mobile: Button is processing, ignoring click');
                return;
            }
            
            // Force stop any existing speech immediately
            if (window.speechSynthesis.speaking || window.speechSynthesis.pending || speechSynthesisActive) {
                console.log('Mobile: Stopping existing speech');
                window.speechSynthesis.cancel();
                speechSynthesisActive = false;
                currentSpeech = null;
                resetSpeakButton(button);
                showStatus('Speech stopped');
                return;
            }
            
            // Record this speech attempt
            mobileLastSpeechTime = now;
            mobileRecentSpeeches.push({ text: textToSpeak, time: now });
            
            // Keep only recent speeches (last 10 entries)
            if (mobileRecentSpeeches.length > 10) {
                mobileRecentSpeeches = mobileRecentSpeeches.slice(-10);
            }
              // Block button for 3 seconds to prevent rapid firing
            button.setAttribute('data-mobile-blocked', 'true');
            button.setAttribute('data-processing', 'true');
            
            // Show mobile protection status
            showStatus('Mobile protection: Starting speech...', false);
            
            setTimeout(() => {
                button.removeAttribute('data-mobile-blocked');
                console.log('Mobile: Button unblocked after cooldown');
            }, 3000);
            
            startMobileSpeech(button);
        }
        
        // Desktop speech handler - standard behavior
        function handleDesktopSpeech(button) {
            console.log('Desktop: Speech button clicked');
            
            if (button.getAttribute('data-processing') === 'true') {
                console.log('Desktop: Button is processing, ignoring click');
                return;
            }
            
            // Stop current speech if active
            if (speechSynthesisActive) {
                console.log('Desktop: Stopping current speech synthesis');
                window.speechSynthesis.cancel();
                speechSynthesisActive = false;
                resetSpeakButton(button);
                return;
            }
            
            startDesktopSpeech(button);
        }
        
        // Mobile-specific speech function
        function startMobileSpeech(button) {
            animateButton(button);
            
            const textToSpeak = textArea.value.trim();
            if (!textToSpeak) {
                showStatus('Nothing to speak. Please record or type some text first.', true);
                resetSpeakButton(button);
                return;
            }

            if (!('speechSynthesis' in window)) {
                showStatus('Text-to-speech is not supported in your browser.', true);
                resetSpeakButton(button);
                return;
            }

            console.log('Mobile: Creating speech utterance');
            
            // Triple-check no speech is active
            window.speechSynthesis.cancel();
            speechSynthesisActive = false;
            currentSpeech = null;
            
            try {
                button.innerHTML = '<i class="fas fa-stop"></i>Stop';
                button.style.background = 'var(--danger)';

                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.rate = userSettings.voiceSpeed;
                utterance.pitch = userSettings.voicePitch;

                if (userSettings.selectedVoice) {
                    const voices = window.speechSynthesis.getVoices();
                    const selectedVoice = voices.find(voice => voice.voiceURI === userSettings.selectedVoice);
                    if (selectedVoice) {
                        utterance.voice = selectedVoice;
                    }
                }

                utterance.onstart = () => {
                    console.log('Mobile: Speech started');
                    speechSynthesisActive = true;
                    currentSpeech = utterance;
                    showStatus('Speaking text...');
                };

                utterance.onend = () => {
                    console.log('Mobile: Speech ended');
                    speechSynthesisActive = false;
                    currentSpeech = null;
                    resetSpeakButton(button);
                    showStatus('Finished speaking');
                    
                    // Extended delay before allowing next speech on mobile
                    setTimeout(() => {
                        button.removeAttribute('data-processing');
                        console.log('Mobile: Button re-enabled after speech end');
                    }, 1000);
                };

                utterance.onerror = (event) => {
                    console.error('Mobile: Speech error:', event);
                    speechSynthesisActive = false;
                    currentSpeech = null;
                    resetSpeakButton(button);
                    showStatus('Error while speaking: ' + (event.error || 'Unknown error'), true);
                    
                    setTimeout(() => {
                        button.removeAttribute('data-processing');
                        console.log('Mobile: Button re-enabled after error');
                    }, 1000);
                };

                // Force one final check and cleanup before speaking
                setTimeout(() => {
                    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                        console.log('Mobile: Final cleanup before speech');
                        window.speechSynthesis.cancel();
                    }
                    
                    setTimeout(() => {
                        console.log('Mobile: Starting speech after final checks');
                        window.speechSynthesis.speak(utterance);
                    }, 100);
                }, 50);
                
            } catch (error) {
                console.error('Mobile: Error creating speech:', error);
                resetSpeakButton(button);
                showStatus('Error using text-to-speech: ' + error.message, true);
            }
        }
        
        // Desktop-specific speech function  
        function startDesktopSpeech(button) {
            animateButton(button);
            button.setAttribute('data-processing', 'true');
            
            const textToSpeak = textArea.value.trim();
            if (!textToSpeak) {
                showStatus('Nothing to speak. Please record or type some text first.', true);
                button.removeAttribute('data-processing');
                return;
            }

            if (!('speechSynthesis' in window)) {
                showStatus('Text-to-speech is not supported in your browser.', true);
                button.removeAttribute('data-processing');
                return;
            }

            try {
                button.innerHTML = '<i class="fas fa-stop"></i>Stop';
                button.style.background = 'var(--danger)';

                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.rate = userSettings.voiceSpeed;
                utterance.pitch = userSettings.voicePitch;

                if (userSettings.selectedVoice) {
                    const voices = window.speechSynthesis.getVoices();
                    const selectedVoice = voices.find(voice => voice.voiceURI === userSettings.selectedVoice);
                    if (selectedVoice) {
                        utterance.voice = selectedVoice;
                    }
                }

                utterance.onstart = () => {
                    console.log('Desktop: Speech started');
                    speechSynthesisActive = true;
                    currentSpeech = utterance;
                    showStatus('Speaking text...');
                };

                utterance.onend = () => {
                    console.log('Desktop: Speech ended');
                    speechSynthesisActive = false;
                    currentSpeech = null;
                    resetSpeakButton(button);
                    showStatus('Finished speaking');
                    button.removeAttribute('data-processing');
                };

                utterance.onerror = (event) => {
                    console.error('Desktop: Speech error:', event);
                    speechSynthesisActive = false;
                    currentSpeech = null;
                    resetSpeakButton(button);
                    showStatus('Error while speaking: ' + (event.error || 'Unknown error'), true);
                    button.removeAttribute('data-processing');
                };

                window.speechSynthesis.speak(utterance);
                
            } catch (error) {
                console.error('Desktop: Error creating speech:', error);
                resetSpeakButton(button);
                showStatus('Error using text-to-speech: ' + error.message, true);
                button.removeAttribute('data-processing');
            }
        }
        
        // Helper function to reset speak button
        function resetSpeakButton(button) {
            button.innerHTML = '<i class="fas fa-volume-up"></i>Speak';
            button.style.background = 'var(--success)';
        }    }, isMobile ? 1500 : 300)); // Much longer debounce for mobile (1.5s vs 300ms)

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

    // Debug panel toggle (Shift+D)
    document.addEventListener('keydown', function(event) {
        // Check for Shift+D
        if (event.shiftKey && event.key === 'D') {
            if (window.SpeechifyDebug && window.SpeechifyDebug.utils && window.SpeechifyDebug.utils.showDebugPanel) {
                window.SpeechifyDebug.utils.showDebugPanel();
            } else {
                console.log('Debug panel not available. Press Ctrl+Shift+D to open debug console.');
            }
        }
    });
});

// Debug tools for Speechify - Enhanced version

/**
 * This file provides debug tools for the Speechify app
 * It helps diagnose speech recognition issues and browser compatibility
 * 
 * Press Ctrl+Shift+D to open the debug panel
 */

// Create a global debug object
window.SpeechifyDebug = {
    // Speech recognition debugging
    recognition: {
        instance: null,
        events: [],
        maxEvents: 50,
        init: function(recognitionInstance) {
            this.instance = recognitionInstance;
            console.log('[Debug] Recognition instance set', recognitionInstance);
        },
        logEvent: function(eventType, data) {
            const event = {
                timestamp: new Date().toISOString(),
                type: eventType,
                data: data
            };
            this.events.unshift(event); // Add to beginning
            if (this.events.length > this.maxEvents) {
                this.events.pop(); // Remove oldest
            }
            console.log(`[Debug] Recognition event: ${eventType}`, data);
        },
        getEvents: function() {
            return this.events;
        },
        clearEvents: function() {
            this.events = [];
            console.log('[Debug] Recognition events cleared');
        },
        showStatus: function() {
            if (!this.instance) {
                return 'No recognition instance';
            }
            return {
                isListening: this.instance._isListening || false,
                continuous: this.instance.continuous,
                interimResults: this.instance.interimResults,
                lang: this.instance.lang,
                maxAlternatives: this.instance.maxAlternatives,
                grammars: this.instance.grammars,
                events: this.events.slice(0, 5) // Last 5 events
            };
        }
    },
    
    // Browser and system info
    systemInfo: {
        collect: function() {
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                vendor: navigator.vendor,
                language: navigator.language,
                languages: navigator.languages,
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
                hardwareConcurrency: navigator.hardwareConcurrency,
                maxTouchPoints: navigator.maxTouchPoints,
                deviceMemory: navigator.deviceMemory,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth,
                speechRecognitionSupport: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
                speechSynthesisSupport: 'speechSynthesis' in window
            };
        },
        
        testSpeechRecognition: function() {
            try {
                const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognitionAPI) {
                    return { supported: false, error: 'SpeechRecognition API not available' };
                }
                
                const testRecognition = new SpeechRecognitionAPI();
                return { 
                    supported: true, 
                    constructor: SpeechRecognitionAPI ? 'Available' : 'Not available',
                    instance: testRecognition ? 'Created successfully' : 'Failed to create instance',
                    properties: {
                        continuous: testRecognition.continuous,
                        interimResults: testRecognition.interimResults,
                        lang: testRecognition.lang,
                        maxAlternatives: testRecognition.maxAlternatives
                    }
                };
            } catch (e) {
                return { supported: false, error: e.toString() };
            }
        }
    },
    
    // Microphone testing
    microphone: {
        testAccess: async function() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // Get audio tracks info
                const audioTracks = stream.getAudioTracks();
                const trackInfo = audioTracks.map(track => ({
                    id: track.id,
                    kind: track.kind,
                    label: track.label,
                    enabled: track.enabled,
                    muted: track.muted,
                    readyState: track.readyState
                }));
                
                // Release the tracks
                audioTracks.forEach(track => track.stop());
                
                return {
                    accessible: true,
                    trackCount: audioTracks.length,
                    tracks: trackInfo
                };
            } catch (e) {
                return {
                    accessible: false,
                    error: e.toString(),
                    name: e.name,
                    message: e.message
                };
            }
        }
    },
    
    // Utility functions
    utils: {
        showDebugPanel: function() {
            // Create debug panel if it doesn't exist
            if (!document.getElementById('debug-panel')) {
                const panel = document.createElement('div');
                panel.id = 'debug-panel';
                panel.style.cssText = `
                    position: fixed;
                    bottom: 0;
                    right: 0;
                    width: 300px;
                    height: 200px;
                    background: rgba(0, 0, 0, 0.8);
                    color: #00FF00;
                    font-family: monospace;
                    padding: 10px;
                    font-size: 12px;
                    overflow: auto;
                    z-index: 10000;
                    border-top-left-radius: 8px;
                `;
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'X';
                closeBtn.style.cssText = `
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #FF3333;
                    border: none;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 10px;
                    cursor: pointer;
                `;
                closeBtn.onclick = () => {
                    document.body.removeChild(panel);
                };
                
                const title = document.createElement('div');
                title.textContent = 'Speechify Debug Console';
                title.style.cssText = `
                    font-weight: bold;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #00FF00;
                    padding-bottom: 5px;
                `;
                
                const content = document.createElement('pre');
                content.id = 'debug-content';
                content.style.cssText = `
                    margin: 0;
                    white-space: pre-wrap;
                    word-break: break-all;
                `;
                
                panel.appendChild(closeBtn);
                panel.appendChild(title);
                panel.appendChild(content);
                document.body.appendChild(panel);
            }
            
            // Update debug content
            const content = document.getElementById('debug-content');
            content.innerHTML = '';
            
            // System info
            const sysInfo = this.appendSection(content, 'System Info');
            const info = window.SpeechifyDebug.systemInfo.collect();
            this.appendKeyValue(sysInfo, 'Browser', info.userAgent);
            this.appendKeyValue(sysInfo, 'Platform', info.platform);
            this.appendKeyValue(sysInfo, 'Speech API', info.speechRecognitionSupport ? 'Supported' : 'Not supported');
            
            // Recognition status
            const recStatus = this.appendSection(content, 'Recognition Status');
            const status = window.SpeechifyDebug.recognition.showStatus();
            if (typeof status === 'string') {
                this.appendKeyValue(recStatus, 'Status', status);
            } else {
                this.appendKeyValue(recStatus, 'Listening', status.isListening ? 'Yes' : 'No');
                this.appendKeyValue(recStatus, 'Continuous', status.continuous ? 'Yes' : 'No');
                this.appendKeyValue(recStatus, 'Interim Results', status.interimResults ? 'Yes' : 'No');
                this.appendKeyValue(recStatus, 'Language', status.lang);
                
                // Recent events
                if (status.events && status.events.length > 0) {
                    const eventsSection = this.appendSection(recStatus, 'Recent Events');
                    status.events.forEach(event => {
                        const line = document.createElement('div');
                        line.textContent = `${event.type} @ ${event.timestamp.split('T')[1].split('.')[0]}`;
                        eventsSection.appendChild(line);
                    });
                }
            }
            
            // Update every second
            setTimeout(() => {
                if (document.getElementById('debug-panel')) {
                    this.showDebugPanel();
                }
            }, 1000);
        },
        
        appendSection: function(parent, title) {
            const section = document.createElement('div');
            section.style.marginBottom = '10px';
            
            const sectionTitle = document.createElement('div');
            sectionTitle.textContent = `--- ${title} ---`;
            sectionTitle.style.marginBottom = '5px';
            sectionTitle.style.color = '#FFFF00';
            
            section.appendChild(sectionTitle);
            parent.appendChild(section);
            return section;
        },
        
        appendKeyValue: function(parent, key, value) {
            const line = document.createElement('div');
            line.textContent = `${key}: ${value}`;
            parent.appendChild(line);
            return line;
        }
    }
};

// Enable debug mode with keyboard shortcut (Ctrl+Shift+D)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        window.SpeechifyDebug.utils.showDebugPanel();
        e.preventDefault();
    }
});

// Function to integrate with speech recognition
function injectDebugIntoRecognition(recognitionInstance) {
    if (!recognitionInstance) return;
    
    // Store the original event handlers
    const originalHandlers = {
        onstart: recognitionInstance.onstart,
        onend: recognitionInstance.onend,
        onerror: recognitionInstance.onerror,
        onresult: recognitionInstance.onresult,
        onspeechend: recognitionInstance.onspeechend
    };
    
    // Set debug tracking
    window.SpeechifyDebug.recognition.init(recognitionInstance);
    
    // Override event handlers to log events
    recognitionInstance.onstart = function(event) {
        window.SpeechifyDebug.recognition.logEvent('start', {});
        if (originalHandlers.onstart) originalHandlers.onstart.call(this, event);
    };
    
    recognitionInstance.onend = function(event) {
        window.SpeechifyDebug.recognition.logEvent('end', {});
        if (originalHandlers.onend) originalHandlers.onend.call(this, event);
    };
    
    recognitionInstance.onerror = function(event) {
        window.SpeechifyDebug.recognition.logEvent('error', {
            error: event.error,
            message: event.message
        });
        if (originalHandlers.onerror) originalHandlers.onerror.call(this, event);
    };
    
    recognitionInstance.onresult = function(event) {
        // Extract useful data from the result
        const results = [];
        for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const alternatives = [];
            for (let j = 0; j < result.length; j++) {
                alternatives.push({
                    transcript: result[j].transcript,
                    confidence: result[j].confidence
                });
            }
            results.push({
                isFinal: result.isFinal,
                alternatives: alternatives
            });
        }
        
        window.SpeechifyDebug.recognition.logEvent('result', {
            resultIndex: event.resultIndex,
            results: results
        });
        
        if (originalHandlers.onresult) originalHandlers.onresult.call(this, event);
    };
    
    recognitionInstance.onspeechend = function(event) {
        window.SpeechifyDebug.recognition.logEvent('speechend', {});
        if (originalHandlers.onspeechend) originalHandlers.onspeechend.call(this, event);
    };
    
    // Add a method to show debug panel
    recognitionInstance.showDebug = function() {
        window.SpeechifyDebug.utils.showDebugPanel();
    };
    
    return recognitionInstance;
}

// Export the injection function
window.injectDebugIntoRecognition = injectDebugIntoRecognition;

console.log('Speech recognition debug tools loaded. Press Ctrl+Shift+D to open debug panel.');

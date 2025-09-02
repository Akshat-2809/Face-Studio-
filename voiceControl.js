// Voice Control Module for Image Processing Application 
class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.lastCommand = '';
        this.commandHistory = [];
        this.maxHistoryLength = 10;
        
        // Voice command mappings
        this.commands = {
            // Capture commands
            'capture': () => this.executeCommand('capture'),
            'take picture': () => this.executeCommand('capture'),
            'snap': () => this.executeCommand('capture'),
            'take photo': () => this.executeCommand('capture'),
            
            // Camera control
            'toggle camera': () => this.executeCommand('toggleCamera'),
            'start camera': () => this.executeCommand('startCamera'),
            'stop camera': () => this.executeCommand('stopCamera'),
            
            // Face filter commands
            'original face': () => this.executeCommand('faceFilter', 0),
            'face filter zero': () => this.executeCommand('faceFilter', 0),
            'grayscale face': () => this.executeCommand('faceFilter', 1),
            'face filter one': () => this.executeCommand('faceFilter', 1),
            'blur face': () => this.executeCommand('faceFilter', 2),
            'face filter two': () => this.executeCommand('faceFilter', 2),
            'color space face': () => this.executeCommand('faceFilter', 3),
            'face filter three': () => this.executeCommand('faceFilter', 3),
            'pixelate face': () => this.executeCommand('faceFilter', 4),
            'face filter four': () => this.executeCommand('faceFilter', 4),
            
            // Threshold adjustments
            'increase red threshold': () => this.executeCommand('adjustThreshold', 'red', 10),
            'decrease red threshold': () => this.executeCommand('adjustThreshold', 'red', -10),
            'increase green threshold': () => this.executeCommand('adjustThreshold', 'green', 10),
            'decrease green threshold': () => this.executeCommand('adjustThreshold', 'green', -10),
            'increase blue threshold': () => this.executeCommand('adjustThreshold', 'blue', 10),
            'decrease blue threshold': () => this.executeCommand('adjustThreshold', 'blue', -10),
            'reset thresholds': () => this.executeCommand('resetThresholds'),
            
            // System commands
            'help': () => this.executeCommand('help'),
            'status': () => this.executeCommand('status'),
            'debug': () => this.executeCommand('debug'),
            'stop listening': () => this.stopListening(),
            'okay bye': () => this.executeCommand('goodbye'),
            'ok bye': () => this.executeCommand('goodbye'),
            'bye': () => this.executeCommand('goodbye'),
            'goodbye': () => this.executeCommand('goodbye')
        };
        
        this.initializeSpeechRecognition();
        this.createVoiceButton();
        this.setupFeedback();
    }

    initializeSpeechRecognition() {
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            this.showUnsupportedMessage();
            return;
        }
        
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition settings 
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;
        
        // Set up event handlers 
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        const self = this;
        
        this.recognition.onstart = function() {
            console.log('Voice recognition started');
            self.isListening = true;
            self.updateVoiceButton();
            self.showFeedback('Listening for commands...', 'listening');
        };
        
        this.recognition.onend = function() {
            console.log('Voice recognition ended');
            self.isListening = false;
            self.updateVoiceButton();
            self.hideFeedback();
        };
        
        this.recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            self.isListening = false;
            self.updateVoiceButton();
            
            let errorMessage = 'Voice error: ' + event.error;
            self.showFeedback(errorMessage, 'error');
        };
        
        this.recognition.onresult = function(event) {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript.toLowerCase().trim();
                console.log('Voice command heard:', transcript);
                self.processVoiceCommand(transcript);
                self.showFeedback('Command: ' + transcript, 'success');
            }
        };
    }

    createVoiceButton() {
        // Create floating voice button
        const voiceButton = document.createElement('div');
        voiceButton.id = 'voiceButton';
        voiceButton.className = 'voice-button';
        voiceButton.innerHTML = `
            <div class="voice-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
            </div>
            <div class="voice-text">Voice</div>
            <div class="voice-status-dot"></div>
            <div class="voice-button-tooltip">Click to toggle voice commands</div>
        `;
        
        document.body.appendChild(voiceButton);
        
        // Add event listeners
        voiceButton.addEventListener('click', () => {
            if (this.isSupported) {
                this.toggleVoiceRecognition();
            } else {
                this.showUnsupportedMessage();
            }
        });
        
        // Hover effects
        voiceButton.addEventListener('mouseenter', () => {
            if (!this.isListening) {
                voiceButton.classList.add('expanded');
            }
        });
        
        voiceButton.addEventListener('mouseleave', () => {
            if (!this.isListening) {
                voiceButton.classList.remove('expanded');
            }
        });
        
        // Update initial state
        this.updateVoiceButton();
    }

    setupFeedback() {
        // Create feedback overlay
        const feedbackOverlay = document.createElement('div');
        feedbackOverlay.id = 'voiceFeedback';
        feedbackOverlay.className = 'voice-feedback';
        document.body.appendChild(feedbackOverlay);
    }

    toggleVoiceRecognition() {
        if (!this.isSupported) {
            this.showUnsupportedMessage();
            return;
        }
        
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (this.isSupported && this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                console.log('Starting voice recognition...');
            } catch (e) {
                console.error('Error starting voice recognition:', e);
                this.showFeedback('Error starting voice commands', 'error');
            }
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            console.log('Stopping voice recognition...');
        }
    }

    processVoiceCommand(transcript) {
        console.log(`Processing voice command: "${transcript}"`);
        
        // Clean up the command 
        transcript = transcript.replace(/[.,!?]/g, '').trim();
        
        // Add to history
        this.commandHistory.push({
            command: transcript,
            timestamp: new Date(),
            executed: false
        });
        
        if (this.commandHistory.length > this.maxHistoryLength) {
            this.commandHistory.shift();
        }

        // Check for command variations 
        if (transcript.startsWith('switch to ')) {
            const commandName = transcript.replace('switch to ', '');
            this.executeVoiceCommand(commandName);
        } else if (transcript.startsWith('use ')) {
            const commandName = transcript.replace('use ', '');
            this.executeVoiceCommand(commandName);
        } else if (transcript.startsWith('select ')) {
            const commandName = transcript.replace('select ', '');
            this.executeVoiceCommand(commandName);
        } else if (transcript.includes('bye') || transcript.includes('goodbye')) {
            // Handle goodbye variations
            this.executeVoiceCommand('goodbye');
        } else {
            // Direct command execution
            this.executeVoiceCommand(transcript);
        }
    }

    executeVoiceCommand(command) {
        let commandExecuted = false;
        
        // Check for exact matches first
        if (this.commands[command]) {
            this.commands[command]();
            this.commandHistory[this.commandHistory.length - 1].executed = true;
            commandExecuted = true;
            return;
        }
        
        // Check for partial matches
        for (const [cmdName, action] of Object.entries(this.commands)) {
            if (command.includes(cmdName) || this.fuzzyMatch(command, cmdName)) {
                action();
                this.commandHistory[this.commandHistory.length - 1].executed = true;
                commandExecuted = true;
                break;
            }
        }
        
        // Handle threshold value commands (e.g., "set red threshold to 150")
        if (!commandExecuted) {
            const thresholdMatch = command.match(/set\s+(red|green|blue|hsv|lab)\s+threshold\s+to\s+(\d+)/);
            if (thresholdMatch) {
                const channel = thresholdMatch[1];
                const value = parseInt(thresholdMatch[2]);
                this.executeCommand('setThreshold', channel, value);
                commandExecuted = true;
            }
        }
        
        if (!commandExecuted) {
            this.showFeedback(`Command not recognized: "${command}"`, 'warning');
            console.log('Available commands:', Object.keys(this.commands));
        }
    }

    fuzzyMatch(input, command) {
        // Simple fuzzy matching for voice recognition errors
        const inputWords = input.split(' ');
        const commandWords = command.split(' ');
        
        let matches = 0;
        for (const word of commandWords) {
            if (inputWords.some(inputWord => 
                inputWord.includes(word) || 
                word.includes(inputWord) ||
                this.levenshteinDistance(inputWord, word) <= 2
            )) {
                matches++;
            }
        }
        
        return matches / commandWords.length >= 0.6; 
    }

    levenshteinDistance(a, b) {
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }

    executeCommand(action, ...params) {
        console.log(`Executing voice command: ${action}`, params);
        
        try {
            switch (action) {
                case 'capture':
                    if (typeof uiController !== 'undefined' && uiController) {
                        uiController.captureImage();
                        this.showFeedback('Image captured!', 'success');
                        this.addSuccessState();
                    } else {
                        this.showFeedback('UI Controller not available', 'error');
                    }
                    break;
                    
                case 'toggleCamera':
                    if (typeof uiController !== 'undefined' && uiController) {
                        uiController.toggleCamera();
                        this.showFeedback('Camera toggled', 'success');
                        this.addSuccessState();
                    } else {
                        this.showFeedback('UI Controller not available', 'error');
                    }
                    break;
                    
                case 'startCamera':
                    if (typeof cameraActive !== 'undefined') {
                        cameraActive = true;
                        if (typeof uiController !== 'undefined' && uiController) {
                            uiController.updateStatusText('Camera started via voice');
                        }
                        this.showFeedback('Camera started', 'success');
                        this.addSuccessState();
                    }
                    break;
                    
                case 'stopCamera':
                    if (typeof cameraActive !== 'undefined') {
                        cameraActive = false;
                        if (typeof uiController !== 'undefined' && uiController) {
                            uiController.updateStatusText('Camera stopped via voice');
                        }
                        this.showFeedback('Camera stopped', 'success');
                        this.addSuccessState();
                    }
                    break;
                    
                case 'faceFilter':
                    const filterValue = params[0];
                    if (filterValue >= 0 && filterValue <= 4) {
                        if (typeof currentFaceFilter !== 'undefined') {
                            currentFaceFilter = filterValue;
                        }
                        
                        // Update UI
                        if (typeof uiController !== 'undefined' && uiController) {
                            uiController.updateFilterButtons();
                            uiController.updateStatusText(`Face filter: ${uiController.getFilterName(filterValue)}`);
                        }
                        
                        // Apply filter if image is captured
                        if (typeof capturedImage !== 'undefined' && capturedImage && typeof processFaceDetection === 'function') {
                            processFaceDetection();
                        }
                        
                        const filterNames = ['Original', 'Grayscale', 'Blur', 'Color Space', 'Pixelate'];
                        this.showFeedback(`Face filter: ${filterNames[filterValue]}`, 'success');
                        this.addSuccessState();
                    }
                    break;
                    
                case 'adjustThreshold':
                    const channel = params[0];
                    const adjustment = params[1];
                    this.adjustThresholdValue(channel, adjustment);
                    break;
                    
                case 'setThreshold':
                    const setChannel = params[0];
                    const setValue = params[1];
                    this.setThresholdValue(setChannel, setValue);
                    break;
                    
                case 'resetThresholds':
                    this.resetAllThresholds();
                    break;
                    
                case 'help':
                    this.showHelpCommands();
                    break;
                    
                case 'status':
                    this.showSystemStatus();
                    break;
                    
                case 'debug':
                    if (typeof debugApplicationState === 'function') {
                        debugApplicationState();
                        this.showFeedback('Debug info logged to console', 'info');
                    }
                    break;
                    
                case 'goodbye':
                    this.handleGoodbye();
                    break;
                    
                default:
                    console.warn(`Unknown voice command action: ${action}`);
                    this.showFeedback(`Unknown command: ${action}`, 'warning');
            }
        } catch (error) {
            console.error(`Error executing voice command ${action}:`, error);
            this.showFeedback(`Error executing command: ${error.message}`, 'error');
            this.addErrorState();
        }
    }

    adjustThresholdValue(channel, adjustment) {
        const slider = document.getElementById(`${channel}Threshold`);
        const valueSpan = document.getElementById(`${channel}Value`);
        
        if (slider && valueSpan) {
            const currentValue = parseInt(slider.value);
            const newValue = Math.max(0, Math.min(255, currentValue + adjustment));
            
            slider.value = newValue;
            valueSpan.textContent = newValue;
            
            // Trigger change event
            slider.dispatchEvent(new Event('input'));
            
            this.showFeedback(`${channel} threshold: ${newValue}`, 'success');
            this.addSuccessState();
        } else {
            this.showFeedback(`Cannot adjust ${channel} threshold`, 'error');
            this.addErrorState();
        }
    }

    setThresholdValue(channel, value) {
        const slider = document.getElementById(`${channel}Threshold`);
        const valueSpan = document.getElementById(`${channel}Value`);
        
        if (slider && valueSpan && value >= 0 && value <= 255) {
            slider.value = value;
            valueSpan.textContent = value;
            
            // Trigger change event
            slider.dispatchEvent(new Event('input'));
            
            this.showFeedback(`${channel} threshold set to: ${value}`, 'success');
            this.addSuccessState();
        } else {
            this.showFeedback(`Cannot set ${channel} threshold to ${value}`, 'error');
            this.addErrorState();
        }
    }

    resetAllThresholds() {
        const channels = ['red', 'green', 'blue', 'hsv', 'lab'];
        
        channels.forEach(channel => {
            this.setThresholdValue(channel, 128);
        });
        
        this.showFeedback('All thresholds reset to 128', 'success');
        this.addSuccessState();
    }

    showHelpCommands() {
        const helpText = `
Voice Commands Available:
• "capture" - Take a snapshot
• "toggle camera" - Start/stop camera
• "grayscale face" - Apply grayscale filter
• "blur face" - Apply blur filter
• "pixelate face" - Apply pixelate filter
• "original face" - Remove filters
• "increase/decrease [color] threshold"
• "set [color] threshold to [number]"
• "reset thresholds"
• "stop listening" - Stop voice recognition
• "help" - Show this help
        `.trim();
        
        console.log(helpText);
        this.showFeedback('Help commands logged to console', 'info');
        
        // Also show in UI if available
        if (typeof uiController !== 'undefined' && uiController) {
            uiController.updateStatusText('Voice help displayed in console');
        }
    }

    showSystemStatus() {
        const status = {
            voiceSupported: this.isSupported,
            listening: this.isListening,
            cameraActive: typeof cameraActive !== 'undefined' ? cameraActive : 'unknown',
            imagesCaptured: typeof capturedImage !== 'undefined' ? !!capturedImage : 'unknown',
            currentFaceFilter: typeof currentFaceFilter !== 'undefined' ? currentFaceFilter : 'unknown',
            commandHistory: this.commandHistory.length
        };
        
        console.log('Voice Control System Status:', status);
        this.showFeedback('System status logged to console', 'info');
    }

    addSuccessState() {
        const button = document.getElementById('voiceButton');
        if (button) {
            button.classList.add('success');
            setTimeout(() => {
                button.classList.remove('success');
            }, 600);
        }
    }

    addErrorState() {
        const button = document.getElementById('voiceButton');
        if (button) {
            button.classList.add('error');
            setTimeout(() => {
                button.classList.remove('error');
            }, 500);
        }
    }

    handleGoodbye() {
        console.log('Goodbye command received');
        
        // Show goodbye message with special styling
        this.showFeedback('See Ya Soon! 👋', 'success');
        
        // Add a special goodbye animation to the button
        const button = document.getElementById('voiceButton');
        if (button) {
            button.classList.add('success');
            setTimeout(() => {
                button.classList.remove('success');
            }, 2000);
        }
        
        // Auto turn off mic after 2 seconds
        setTimeout(() => {
            if (this.isListening) {
                this.stopListening();
                console.log('Voice control automatically stopped after goodbye');
            }
        }, 2000);
    }

    updateVoiceButton() {
        const button = document.getElementById('voiceButton');
        if (!button) return;
        
        if (this.isListening) {
            button.classList.add('listening');
            button.classList.add('expanded');
            button.querySelector('.voice-text').textContent = 'Listening...';
        } else {
            button.classList.remove('listening');
            button.querySelector('.voice-text').textContent = 'Voice';
            // Keep expanded state on hover
        }
        
        if (!this.isSupported) {
            button.classList.add('disabled');
            button.querySelector('.voice-text').textContent = 'No Voice';
        }
    }

    showFeedback(message, type = 'info') {
        const feedback = document.getElementById('voiceFeedback');
        if (!feedback) return;
        
        feedback.textContent = message;
        feedback.className = `voice-feedback show ${type}`;
        
        // Special handling for goodbye message - show for 2 seconds
        const duration = message.includes('See Ya Soon') ? 2000 : 3000;
        
        setTimeout(() => {
            this.hideFeedback();
        }, duration);
    }

    hideFeedback() {
        const feedback = document.getElementById('voiceFeedback');
        if (feedback) {
            feedback.classList.remove('show');
        }
    }

    showUnsupportedMessage() {
        this.showFeedback('Voice recognition not supported in this browser. Try Chrome or Edge.', 'error');
        console.warn('Speech recognition not supported. Try Chrome or Edge browser.');
    }

    // Cleanup method
    destroy() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        
        // Remove DOM elements
        const button = document.getElementById('voiceButton');
        const feedback = document.getElementById('voiceFeedback');
        
        if (button) button.remove();
        if (feedback) feedback.remove();
    }

    // Get available commands for help
    getAvailableCommands() {
        return Object.keys(this.commands);
    }

    // Get command history
    getCommandHistory() {
        return this.commandHistory;
    }
}

// Initialize voice controller when DOM is ready
let voiceController = null;

function initializeVoiceControl() {
    try {
        // Clean up existing instance
        if (voiceController) {
            voiceController.destroy();
        }
        
        voiceController = new VoiceController();
        console.log('Voice control initialized successfully');
        
        // Add keyboard shortcut to toggle voice 
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'v' && !event.ctrlKey && !event.altKey && !event.metaKey) {
                const activeElement = document.activeElement;
                // Don't trigger if user is typing in an input field
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    event.preventDefault();
                    if (voiceController && voiceController.isSupported) {
                        voiceController.toggleVoiceRecognition();
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error initializing voice control:', error);
    }
}

// Auto-initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVoiceControl);
} else {
    initializeVoiceControl();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (voiceController) {
        voiceController.destroy();
    }
});
// Loader JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeLoader();
});

function initializeLoader() {
    createParticles();
    startLoadingSequence();
}

// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random positioning
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Random animation delay
        particle.style.animationDelay = Math.random() * 6 + 's';
        
        // Random size variation
        const size = 2 + Math.random() * 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Random opacity
        particle.style.opacity = 0.3 + Math.random() * 0.7;
        
        particlesContainer.appendChild(particle);
    }
}

// Loading sequence with progress simulation
function startLoadingSequence() {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const loadingStep = document.getElementById('loadingStep');
    
    const loadingSteps = [
        { percent: 15, text: 'Loading graphics engines...' },
        { percent: 30, text: 'Initializing camera systems...' },
        { percent: 50, text: 'Setting up face detection...' },
        { percent: 70, text: 'Loading image processors...' },
        { percent: 85, text: 'Configuring color spaces...' },
        { percent: 95, text: 'Finalizing setup...' },
        { percent: 100, text: 'Ready to launch!' }
    ];
    
    let currentStep = 0;
    let currentProgress = 0;
    
    function updateProgress() {
        if (currentStep < loadingSteps.length) {
            const targetProgress = loadingSteps[currentStep].percent;
            const stepText = loadingSteps[currentStep].text;
            
            // Smooth progress animation
            const progressInterval = setInterval(() => {
                if (currentProgress < targetProgress) {
                    currentProgress += 1;
                    progressFill.style.width = currentProgress + '%';
                    progressPercent.textContent = currentProgress + '%';
                } else {
                    clearInterval(progressInterval);
                    loadingStep.textContent = stepText;
                    currentStep++;
                    
                    // Continue to next step after a brief pause
                    setTimeout(updateProgress, 300 + Math.random() * 400);
                }
            }, 30);
        } else {
            // Loading complete, transition to main app
            setTimeout(transitionToMainApp, 800);
        }
    }
    
    // Start the loading sequence
    setTimeout(updateProgress, 1000);
}

// Transition to main application
function transitionToMainApp() {
    const overlay = document.getElementById('transitionOverlay');
    const subtitle = document.querySelector('.subtitle');
    
    // Update subtitle
    subtitle.textContent = 'Welcome to the studio!';
    
    // Activate transition overlay
    overlay.classList.add('active');
    
    // Navigate to main app after transition
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Add some interactive effects
document.addEventListener('mousemove', function(e) {
    const rings = document.querySelectorAll('.ring');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const deltaX = (e.clientX - centerX) / centerX;
    const deltaY = (e.clientY - centerY) / centerY;
    
    rings.forEach((ring, index) => {
        const offset = (index + 1) * 5;
        ring.style.transform = `translate(${deltaX * offset}px, ${deltaY * offset}px)`;
    });
});

// Add click effect to center icon
document.querySelector('.center-icon').addEventListener('click', function() {
    this.style.animation = 'none';
    setTimeout(() => {
        this.style.animation = 'pulse 0.5s ease-in-out, spin 1s ease-in-out';
    }, 10);
    
    setTimeout(() => {
        this.style.animation = 'pulse 2s ease-in-out infinite';
    }, 1500);
});

// Keyboard shortcut to skip loading (for development)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        transitionToMainApp();
    }
});
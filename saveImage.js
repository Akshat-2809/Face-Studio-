// Save Image  for Image Processing Application
class ImageSaveController {
    constructor() {
        this.selectedImageType = null;
        this.modal = null;
        this.isModalOpen = false;
        this.imageData = {};
        this.lastPreviewUpdate = 0; // For throttling preview updates
        
        this.initializeModal();
        this.setupEventListeners();
        this.updateQualityDisplay();
    }

    initializeModal() {
        this.modal = document.getElementById('saveModal');
        if (!this.modal) {
            console.error('Save modal not found in DOM');
            return;
        }
        
        console.log('Save modal initialized');
    }

    setupEventListeners() {
        // Save button click
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.openSaveModal();
            });
        }

        // Modal close button
        const closeBtn = this.modal?.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSaveModal();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelSave');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeSaveModal();
            });
        }

        // Confirm save button
        const confirmBtn = document.getElementById('confirmSave');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmSave();
            });
        }

        // Image option selection
        const imageOptions = this.modal?.querySelectorAll('.image-option');
        if (imageOptions) {
            imageOptions.forEach(option => {
                option.addEventListener('click', () => {
                    this.selectImageOption(option);
                });
            });
        }

        // Quality slider
        const qualitySlider = document.getElementById('imageQuality');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                this.updateQualityDisplay(e.target.value);
            });
        }

        // Click outside modal to close
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeSaveModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isModalOpen) {
                if (e.key === 'Escape') {
                    this.closeSaveModal();
                } else if (e.key === 'Enter' && this.selectedImageType) {
                    this.confirmSave();
                }
            }
        });
    }

    openSaveModal() {
        if (!capturedImage) {
            this.showNotification('Please capture an image first!', 'warning');
            return;
        }
        
        if (this.modal) {
            this.modal.style.display = 'block';
            this.isModalOpen = true;
            
            // Update previews
            this.updateSaveModalPreviews();
            
            // Add opening animation
            setTimeout(() => {
                this.modal.classList.add('show');
            }, 10);
        }
    }

    closeSaveModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            this.isModalOpen = false;
            
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.clearSelection();
            }, 300);
        }
    }

    selectImageOption(option) {
        // Remove previous selection
        this.modal?.querySelectorAll('.image-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Add selection to clicked option
        option.classList.add('selected');
        this.selectedImageType = option.dataset.type;

        // Enable confirm button
        const confirmBtn = document.getElementById('confirmSave');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = `Save ${this.getImageTypeName(this.selectedImageType)}`;
        }
    }

    clearSelection() {
        this.selectedImageType = null;
        const confirmBtn = document.getElementById('confirmSave');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Save Selected Image';
        }
    }

    getImageTypeName(type) {
        const names = {
            'original': 'Webcam Image',
            'grayscale': 'Grayscale + Brightness',
            'redChannel': 'Red Channel',
            'greenChannel': 'Green Channel',
            'blueChannel': 'Blue Channel',
            'redThreshold': 'Red Threshold',
            'greenThreshold': 'Green Threshold',
            'blueThreshold': 'Blue Threshold',
            'originalRepeat': 'Webcam Image Copy',
            'hsvConversion': 'HSV Color Space',
            'labConversion': 'Lab Color Space',
            'hsvThreshold': 'HSV Threshold',
            'labThreshold': 'Lab Threshold',
            'faceDetection': 'Face Detection'
        };
        return names[type] || type;
    }

    updateSaveModalPreviews() {
        if (!this.modal || !capturedImage) return;

        // Throttle preview updates to improve performance
        if (this.lastPreviewUpdate && Date.now() - this.lastPreviewUpdate < 500) {
            return; 
        }
        this.lastPreviewUpdate = Date.now();

        const imageTypes = [
            'original', 'grayscale', 'redChannel', 'greenChannel', 'blueChannel',
            'redThreshold', 'greenThreshold', 'blueThreshold', 'originalRepeat',
            'hsvConversion', 'labConversion', 'hsvThreshold', 'labThreshold', 'faceDetection'
        ];

        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
            imageTypes.forEach(type => {
                const previewDiv = document.getElementById(`preview-${type}`);
                const sourceCanvas = document.getElementById(`canvas_${type}`);
                
                if (previewDiv && sourceCanvas) {
                    try {
                        // Create thumbnail canvas with reduced size for better performance
                        const thumbnailCanvas = document.createElement('canvas');
                        const thumbnailSize = 60; 
                        thumbnailCanvas.width = thumbnailSize;
                        thumbnailCanvas.height = thumbnailSize;
                        
                        const ctx = thumbnailCanvas.getContext('2d');
                        
                        // Draw scaled down version with better quality
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'low'; // Use low quality for performance
                        ctx.drawImage(sourceCanvas, 0, 0, thumbnailSize, thumbnailSize);
                        
                        // Clear previous content and add thumbnail
                        previewDiv.innerHTML = '';
                        previewDiv.appendChild(thumbnailCanvas);
                        
                        // Store the image data for later download
                        this.imageData[type] = sourceCanvas;
                        
                    } catch (error) {
                        console.error(`Error creating preview for ${type}:`, error);
                        previewDiv.innerHTML = '<div class="preview-error">Preview Error</div>';
                    }
                }
            });
        });
    }

    confirmSave() {
        if (!this.selectedImageType) {
            this.showNotification('Please select an image to save', 'warning');
            return;
        }

        const canvas = this.imageData[this.selectedImageType];
        if (!canvas) {
            this.showNotification('Image data not available', 'error');
            return;
        }

        try {
            const format = document.getElementById('imageFormat')?.value || 'png';
            const quality = parseFloat(document.getElementById('imageQuality')?.value || '0.9');
            
            this.downloadImage(canvas, this.selectedImageType, format, quality);
            this.closeSaveModal();
            
        } catch (error) {
            console.error('Error saving image:', error);
            this.showNotification('Error saving image: ' + error.message, 'error');
        }
    }

    downloadImage(canvas, imageType, format, quality) {
        try {
            
            let mimeType;
            let fileExtension;
            
            switch (format) {
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    fileExtension = 'jpg';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    fileExtension = 'webp';
                    break;
                default:
                    mimeType = 'image/png';
                    fileExtension = 'png';
                    quality = undefined; 
            }

            // Convert canvas to blob
            const dataURL = quality !== undefined ? 
                canvas.toDataURL(mimeType, quality) : 
                canvas.toDataURL(mimeType);

            // Create download link
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const fileName = `ImageProcessing_${imageType}_${timestamp}.${fileExtension}`;
            
            link.download = fileName;
            link.href = dataURL;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`Image saved: ${fileName}`);
            this.showNotification(`Image saved: ${fileName}`, 'success');
            
        } catch (error) {
            console.error('Error downloading image:', error);
            this.showNotification('Error downloading image: ' + error.message, 'error');
        }
    }

    updateQualityDisplay(value) {
        const qualityValue = document.getElementById('qualityValue');
        if (qualityValue) {
            const percentage = Math.round(parseFloat(value || 0.9) * 100);
            qualityValue.textContent = `${percentage}%`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('saveNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'saveNotification';
            notification.className = 'save-notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `save-notification show ${type}`;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);

        // Also update status text if available
        if (typeof uiController !== 'undefined' && uiController) {
            uiController.updateStatusText(message);
        }
    }

    // Public method to update previews 
    updatePreviews() {
        if (this.isModalOpen) {
            this.updateSaveModalPreviews();
        }
    }

    // Method to save specific image type programmatically (for voice commands)
    saveImageType(imageType, format = 'png', quality = 0.9) {
        const canvas = this.imageData[imageType] || document.getElementById(`canvas_${imageType}`);
        if (canvas) {
            this.downloadImage(canvas, imageType, format, quality);
            return true;
        } else {
            this.showNotification(`Image type ${imageType} not available`, 'error');
            return false;
        }
    }

    // Get list of available image types
    getAvailableImageTypes() {
        return Object.keys(this.imageData);
    }
}

// Initialize save controller when DOM is ready
let imageSaveController = null;

function initializeSaveController() {
    // Prevent multiple initializations
    if (imageSaveController) {
        return;
    }
    
    try {
        imageSaveController = new ImageSaveController();
        console.log('Save controller initialized successfully');
    } catch (error) {
        console.error('Error initializing save controller:', error);
    }
}

// Global function to update modal previews 
function updateSaveModalPreviews() {
    if (imageSaveController) {
        imageSaveController.updatePreviews();
    }
}

// Voice command integration for save functionality
function addVoiceSaveCommands() {
    if (typeof voiceController !== 'undefined' && voiceController) {
        // Add save-related voice commands
        const saveCommands = {
            'save original': () => imageSaveController?.saveImageType('original'),
            'save webcam': () => imageSaveController?.saveImageType('original'),
            'save grayscale': () => imageSaveController?.saveImageType('grayscale'),
            'save red channel': () => imageSaveController?.saveImageType('redChannel'),
            'save green channel': () => imageSaveController?.saveImageType('greenChannel'),
            'save blue channel': () => imageSaveController?.saveImageType('blueChannel'),
            'save face detection': () => imageSaveController?.saveImageType('faceDetection'),
            'save hsv': () => imageSaveController?.saveImageType('hsvConversion'),
            'save lab': () => imageSaveController?.saveImageType('labConversion')
        };
        
        // Extend voice controller commands
        Object.assign(voiceController.commands, saveCommands);
        console.log('Voice save commands added');
    }
}

// Auto-initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSaveController();
        // Add voice commands after a short delay to ensure voice controller is ready
        setTimeout(addVoiceSaveCommands, 1000);
    });
} else {
    initializeSaveController();
    setTimeout(addVoiceSaveCommands, 1000);
}

// Enhanced keyboard shortcuts for save functionality
document.addEventListener('keydown', (event) => {
    // Ctrl+S or Cmd+S to open save modal
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (imageSaveController) {
            imageSaveController.openSaveModal();
        }
    }
    
    // Quick save shortcuts (when modal is open)
    if (imageSaveController?.isModalOpen) {
        const keyMap = {
            '1': 'original',
            '2': 'grayscale', 
            '3': 'redChannel',
            '4': 'greenChannel',
            '5': 'blueChannel',
            '6': 'faceDetection'
        };
        
        if (keyMap[event.key]) {
            const option = document.querySelector(`[data-type="${keyMap[event.key]}"]`);
            if (option) {
                imageSaveController.selectImageOption(option);
            }
        }
    }
});

// Utility function to save all images at once
function saveAllImages() {
    if (!imageSaveController || !capturedImage) {
        console.warn('Cannot save all images - save controller or captured image not available');
        return;
    }

    const imageTypes = [
        'original', 'grayscale', 'redChannel', 'greenChannel', 'blueChannel',
        'redThreshold', 'greenThreshold', 'blueThreshold', 
        'hsvConversion', 'labConversion', 'hsvThreshold', 'labThreshold', 'faceDetection'
    ];

    let savedCount = 0;
    const totalImages = imageTypes.length;

    imageTypes.forEach((type, index) => {
        setTimeout(() => {
            if (imageSaveController.saveImageType(type)) {
                savedCount++;
            }
            
            if (index === totalImages - 1) {
                imageSaveController.showNotification(
                    `Saved ${savedCount}/${totalImages} images`, 
                    savedCount === totalImages ? 'success' : 'warning'
                );
            }
        }, index * 200); // Stagger downloads to avoid browser blocking
    });
}

// Export functions for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ImageSaveController,
        initializeSaveController,
        updateSaveModalPreviews,
        saveAllImages
    };
}
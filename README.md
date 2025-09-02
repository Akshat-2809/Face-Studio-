# 🎨 Advanced Image Processing Studio

## Project Overview

An advanced image processing application with real-time webcam processing, face detection, and voice control capabilities developed for CM2030 Graphics Programming coursework.

### Core Features
- ✅ Grayscale conversion with brightness enhancement
- ✅ RGB channel extraction and thresholding
- ✅ HSV and Lab color space conversions
- ✅ Face detection with multiple filters
- ✅ Pixelation using 5x5 block processing
- ✅ Real-time webcam integration

### Extensions
- 🎤 **Voice Control** - Hands-free operation with speech recognition
- 💾 **Image Save** - Export in multiple formats (PNG, JPEG, WebP)
- 🎯 **Enhanced Face Detection** - Multi-strategy detection with skin tone analysis
- 🎨 **Advanced Loading Animations** - Professional UI with animated particles

## Installation

1. **Download** the project files
2. **Start a local web server**:
   ```bash
   python -m http.server 8000
   # OR
   npx http-server
   ```
3. **Open browser** and navigate to `http://localhost:8000/start.html`
4. **Allow camera and microphone permissions**

## Usage

### Controls
- **Capture Button**: Take webcam snapshot
- **Filter Buttons (0-4)**: Apply face filters
- **Voice Button**: Toggle voice control
- **Save Button**: Export images

### Face Filters
- **0**: Original face
- **1**: Grayscale with brightness
- **2**: Blur effect
- **3**: HSV color space
- **4**: Pixelation

### Voice Commands
- "capture" - Take picture
- "grayscale face" - Apply filter 1
- "blur face" - Apply filter 2
- "help" - Show commands
- "stop listening" - Disable voice

## Project Structure
```
FaceDetection/
├── start.html          # Entry point
├── loader.html         # Loading screen
├── index.html          # Main application
├── script.js           # Core logic
├── voiceControl.js     # Voice control
├── saveImage.js        # Save functionality
├── loader.js           # Loading animations
└── *.css              # Styling files
```

## Browser Support
- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Complete functionality
- **Safari**: Limited voice control

## Troubleshooting
- **Camera issues**: Check permissions and close other camera apps
- **Voice not working**: Use Chrome/Edge, ensure microphone access
- **Performance**: Close other tabs, check hardware limitations

## Technical Highlights
- Multi-strategy face detection with ML5.js
- Fuzzy matching for voice commands
- Real-time image processing at 30 FPS
- Professional loading animations with CSS effects

---
*CM2030 Graphics Programming Project*

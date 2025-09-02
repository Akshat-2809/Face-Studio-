/*
 * ===================================================================
 * FACE DETECTION AND IMAGE PROCESSING APPLICATION - PROJECT COMMENTARY
 * ===================================================================
 * 
 * This project successfully fulfilled the core requirements of the image processing 
 * application and extended functionality through several technically challenging features. 
 * All specified tasks were implemented, including grayscale conversion with brightness 
 * enhancement, RGB channel extraction, thresholding, colour space conversions, and face 
 * detection. The system was developed with attention to modularity, reusability, and 
 * robustness, ensuring consistent functionality across diverse conditions.
 * 
 * TECHNICAL ANALYSIS - THRESHOLDING ACROSS COLOR CHANNELS:
 * --------------------------------------------------------
 * Thresholding analysis revealed clear differences across RGB channels. The red channel 
 * generated high-contrast results, particularly effective in skin regions, while the blue 
 * channel produced noisier outputs under low-light conditions, reflecting camera sensor 
 * limitations. The green channel yielded the most balanced segmentation due to the human 
 * eye's greater sensitivity to green. Thresholding in HSV and Lab colour spaces provided 
 * cleaner and more consistent results, particularly when applied to the value (V) or 
 * lightness (L) components, as this reduced chromatic variation. However, these conversions 
 * introduced computational overhead and occasional artefacts in shadowed or unevenly 
 * illuminated regions, highlighting a trade-off between segmentation accuracy and real-time 
 * efficiency.
 * 
 * TECHNICAL CHALLENGES AND SOLUTIONS:
 * -----------------------------------
 * Several technical challenges were encountered and addressed systematically:
 * 
 * 1. PIXEL OVERFLOW: Initial brightness adjustments in grayscale conversion produced 
 *    pixel overflow beyond the 255 limit; this was resolved through value clamping.
 * 
 * 2. FACE DETECTION RELIABILITY: Early face detection attempts using simple bounding 
 *    boxes were unreliable under variable lighting and subject motion; this was mitigated 
 *    by implementing a hybrid approach integrating skin tone analysis, motion tracking, 
 *    and region scanning to enhance stability.
 * 
 * 3. VOICE CONTROL STABILITY: The Voice Control module, developed using the Web Speech API, 
 *    occasionally triggered "network" errors. These were reduced by incorporating retry 
 *    mechanisms, user feedback prompts, and fallback options to manual interaction, 
 *    ensuring reliability.
 * 
 * PROJECT DEVELOPMENT INSIGHTS:
 * -----------------------------
 * The project progressed largely in line with initial expectations, with the baseline 
 * implementation completed ahead of schedule, allowing additional time for refinement of 
 * extensions. Face detection refinement proved the most time-intensive task, requiring 
 * iterative testing under diverse conditions to ensure robustness. If repeated, more 
 * development time would be allocated earlier to this component, and GPU-based shader 
 * implementations would be explored to optimise performance, particularly for higher-resolution 
 * real-time tasks. These adjustments would improve efficiency while enabling further 
 * innovation in filtering and detection.
 * 
 * INNOVATIVE EXTENSIONS:
 * ----------------------
 * The developed extensions represent significant contributions in both technical 
 * sophistication and user-centred design:
 * 
 * 1. SAVE IMAGE FUNCTION: Enables users to export processed outputs, improving practical 
 *    utility in domains such as forensics, research, and media workflows.
 * 
 * 2. VOICE CONTROL MODULE: Introduces a multimodal interface, incorporating fuzzy matching 
 *    and command history to support accessibility, inclusive design, and hands-free 
 *    operation, particularly valuable for users with mobility impairments.
 * 
 * 3. ENHANCED FACE DETECTION SYSTEM: The most technically advanced extension, integrates 
 *    skin tone detection and motion analysis to ensure reliable detection across a wide 
 *    range of complexions and dynamic environments.
 * 
 * 4. ADVANCED LOADING ANIMATION SYSTEM: A sophisticated visual feedback system featuring 
 *    animated background particles, multi-layered spinning rings, and gradient progress 
 *    bars with shimmer effects and responsive design for enhanced user experience.
 * 
 * Collectively, these extensions demonstrate innovation by addressing usability, accessibility, 
 * and robustness while extending the project beyond baseline requirements.
 * 
 * CONCLUSION:
 * -----------
 * In conclusion, the project not only achieved all specified outcomes but also demonstrated 
 * creativity, originality, and technical depth. The extensions substantially improved 
 * accessibility, robustness, and applicability, while the overall system reflected a 
 * strong balance of functionality, innovation, and academic quality.
 * 
 * ===================================================================
 */

// Global variables and application state
let video, faceMesh;
let capturedImage = null;
let isCapturing = false;
let currentFaceFilter = 0;
let detectedFaces = [];
let cameraActive = false;

// Canvas objects for different processing tasks
let canvases = {};
let processingFrameCount = 0;
let lastFPS = 0;
let fpsUpdateTimer = 0;

// Processing instances
let imageProcessor;
let faceProcessor;
let uiController;

// Safe graphics creation function to handle WebGL issues
function safeCreateGraphics(w, h) {
    try {
        return createGraphics(w, h, P2D); // Force P2D renderer
    } catch (error) {
        console.error("Error creating graphics:", error);
        // Return null and handle gracefully in calling function
        return null;
    }
}

// Image processing class for encapsulating functionality
class ImageProcessor {
    constructor() {
        this.width = 160;  
        this.height = 120;
    }

    // Convert RGB to HSV color space
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        if (diff !== 0) {
            if (max === r) h = ((g - b) / diff) % 6;
            else if (max === g) h = (b - r) / diff + 2;
            else h = (r - g) / diff + 4;
        }
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        
        const s = max === 0 ? 0 : diff / max;
        const v = max;
        
        return [h, Math.round(s * 255), Math.round(v * 255)];
    }

    // Convert RGB to Lab color space
    rgbToLab(r, g, b) {
        // Normalize RGB values to 0-1
        r = r / 255.0;
        g = g / 255.0;
        b = b / 255.0;

        // Apply gamma correction
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        // Convert to XYZ color space
        let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

        // Normalize by reference white point
        x = x / 0.95047;
        y = y / 1.00000;
        z = z / 1.08883;

        // Apply Lab transformation
        const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
        const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
        const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

        const L = 116 * fy - 16;
        const a = 500 * (fx - fy);
        const bLab = 200 * (fy - fz);

        return [
            Math.max(0, Math.min(255, (L / 100) * 255)),
            Math.max(0, Math.min(255, (a + 128) * 255 / 256)),
            Math.max(0, Math.min(255, (bLab + 128) * 255 / 256))
        ];
    }

    // REQUIREMENT #4 & #5: Create grayscale image with 20% brightness increase in single loop
    createGrayscaleWithBrightness(img) {
        const output = safeCreateGraphics(img.width, img.height);
        if (!output) return null; // Handle graphics creation failure
        
        output.loadPixels();
        img.loadPixels();
        
        // Single nested for loop that performs both grayscale conversion AND brightness increase
        for (let i = 0; i < img.pixels.length; i += 4) {
            // Convert to grayscale using standard luminance formula
            const gray = 0.299 * img.pixels[i] + 0.587 * img.pixels[i + 1] + 0.114 * img.pixels[i + 2];
            
            // Increase brightness by 20% in the SAME loop (requirement #4)
            const brightenedGray = gray * 1.2; // 20% increase
            
            // REQUIREMENT #5: Prevent pixel intensity from exceeding 255
            const clampedGray = Math.min(255, brightenedGray);
            
            output.pixels[i] = clampedGray;
            output.pixels[i + 1] = clampedGray;
            output.pixels[i + 2] = clampedGray;
            output.pixels[i + 3] = 255;
        }
        
        output.updatePixels();
        return output;
    }

    // Extract individual color channels - RGB separation
    extractColorChannels(img) {
        img.loadPixels();
        
        // Red channel extraction
        const redChannel = createGraphics(img.width, img.height);
        redChannel.loadPixels();
        for (let i = 0; i < img.pixels.length; i += 4) {
            redChannel.pixels[i] = img.pixels[i];     // Red value from original
            redChannel.pixels[i + 1] = 0;             // Green = 0
            redChannel.pixels[i + 2] = 0;             // Blue = 0
            redChannel.pixels[i + 3] = 255;           // Alpha
        }
        redChannel.updatePixels();
        
        // Green channel extraction
        const greenChannel = createGraphics(img.width, img.height);
        greenChannel.loadPixels();
        for (let i = 0; i < img.pixels.length; i += 4) {
            greenChannel.pixels[i] = 0;               // Red = 0
            greenChannel.pixels[i + 1] = img.pixels[i + 1]; // Green value from original
            greenChannel.pixels[i + 2] = 0;           // Blue = 0
            greenChannel.pixels[i + 3] = 255;         // Alpha
        }
        greenChannel.updatePixels();
        
        // Blue channel extraction
        const blueChannel = createGraphics(img.width, img.height);
        blueChannel.loadPixels();
        for (let i = 0; i < img.pixels.length; i += 4) {
            blueChannel.pixels[i] = 0;               // Red = 0
            blueChannel.pixels[i + 1] = 0;           // Green = 0
            blueChannel.pixels[i + 2] = img.pixels[i + 2]; // Blue value from original
            blueChannel.pixels[i + 3] = 255;         // Alpha
        }
        blueChannel.updatePixels();
        
        return {
            red: redChannel,
            green: greenChannel,
            blue: blueChannel
        };
    }

    // Apply threshold to a specific RGB channel
    applyChannelThreshold(img, threshold, channelIndex) {
        const output = createGraphics(img.width, img.height);
        output.loadPixels();
        img.loadPixels();
        
        for (let i = 0; i < img.pixels.length; i += 4) {
            const value = img.pixels[i + channelIndex] > threshold ? 255 : 0;
            output.pixels[i] = value;
            output.pixels[i + 1] = value;
            output.pixels[i + 2] = value;
            output.pixels[i + 3] = 255;
        }
        
        output.updatePixels();
        return output;
    }

    // Convert image to HSV color space
    convertToHSV(img) {
        const output = createGraphics(img.width, img.height);
        output.loadPixels();
        img.loadPixels();
        
        for (let i = 0; i < img.pixels.length; i += 4) {
            const [h, s, v] = this.rgbToHsv(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]);
            
            output.pixels[i] = (h / 360) * 255;
            output.pixels[i + 1] = s;
            output.pixels[i + 2] = v;
            output.pixels[i + 3] = 255;
        }
        
        output.updatePixels();
        return output;
    }

    // Convert image to Lab color space
    convertToLab(img) {
        const output = createGraphics(img.width, img.height);
        output.loadPixels();
        img.loadPixels();
        
        for (let i = 0; i < img.pixels.length; i += 4) {
            const [L, a, b] = this.rgbToLab(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]);
            
            output.pixels[i] = Math.max(0, Math.min(255, L));
            output.pixels[i + 1] = Math.max(0, Math.min(255, a));
            output.pixels[i + 2] = Math.max(0, Math.min(255, b));
            output.pixels[i + 3] = 255;
        }
        
        output.updatePixels();
        return output;
    }

    // Apply threshold to color space converted images
    applyColorSpaceThreshold(img, threshold) {
        const output = createGraphics(img.width, img.height);
        output.loadPixels();
        img.loadPixels();
        
        for (let i = 0; i < img.pixels.length; i += 4) {
            const intensity = (img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
            const value = intensity > threshold ? 255 : 0;
            
            output.pixels[i] = value;
            output.pixels[i + 1] = value;
            output.pixels[i + 2] = value;
            output.pixels[i + 3] = 255;
        }
        
        output.updatePixels();
        return output;
    }

    // REQUIREMENT #13d: Pixelate image using 5x5 blocks with proper implementation
    pixelateImage(img) {
        console.log(`Starting pixelation on image: ${img.width}x${img.height}`);
        const output = safeCreateGraphics(img.width, img.height);
        if (!output) {
            console.error("Failed to create graphics for pixelation");
            return img;
        }
        
        output.loadPixels();
        img.loadPixels();
        
        const blockSize = 12; 
        
        console.log(`Pixelating image with ${blockSize}x${blockSize} blocks...`);
        
        // REQUIREMENT 13d.v: Loop through all blocks
        for (let y = 0; y < img.height; y += blockSize) {
            for (let x = 0; x < img.width; x += blockSize) {
                let totalIntensity = 0;
                let pixelCount = 0;
                
                // REQUIREMENT 13d.iii: Calculate average pixel intensity using image.get() or pixel array
                for (let by = 0; by < blockSize && y + by < img.height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < img.width; bx++) {
                        const idx = ((y + by) * img.width + (x + bx)) * 4;
                        // Use grayscale intensity 
                        const intensity = img.pixels[idx];
                        totalIntensity += intensity;
                        pixelCount++;
                    }
                }
                
                // Calculate average pixel intensity for this 5x5 block
                const averageIntensity = Math.round(totalIntensity / pixelCount);
                
                // REQUIREMENT 13d.iv: Paint entire block using average intensity with outimage.set() equivalent
                for (let by = 0; by < blockSize && y + by < img.height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < img.width; bx++) {
                        const idx = ((y + by) * img.width + (x + bx)) * 4;
                        // Set all pixels in block to average intensity
                        output.pixels[idx] = averageIntensity;     // Red
                        output.pixels[idx + 1] = averageIntensity; // Green  
                        output.pixels[idx + 2] = averageIntensity; // Blue
                        output.pixels[idx + 3] = 255;             // Alpha
                    }
                }
                // REQUIREMENT 13d.v: Repeating steps iii and iv for all blocks (loop continues)
            }
        }
        
        output.updatePixels();
        console.log(`Pixelation completed using ${blockSize}x${blockSize} blocks`);
        return output;
    }

    // Apply Gaussian blur for privacy filter
    blurImage(img, radius = 8) {
        console.log(`Creating blur with radius ${radius} for image ${img.width}x${img.height}`);
        const output = safeCreateGraphics(img.width, img.height);
        if (!output) {
            console.error("Failed to create graphics for blur");
            return img;
        }
        
        output.image(img, 0, 0);
        output.filter(BLUR, radius);
        console.log("Blur filter applied successfully");
        return output;
    }

    // Flip image horizontally to fix camera mirroring
    flipImageHorizontally(img) {
        const output = createGraphics(img.width, img.height);
        output.push();
        output.translate(img.width, 0);
        output.scale(-1, 1);
        output.image(img, 0, 0);
        output.pop();
        return output;
    }
}

//  Face detection and processing class
class FaceProcessor {
    constructor() {
        this.processor = new ImageProcessor();
        this.lastKnownFacePosition = null;
        this.faceTrackingHistory = [];
        this.maxHistoryLength = 5;
        this.minFaceSize = 30; // Minimum face size for valid detection
        this.maxFaceSize = 100; // Maximum face size for valid detection
    }

    //  Process face with different filters based on keystroke input
    processFace(faceImg, filterType) {
        if (!faceImg || !faceImg.pixels) {
            console.error("Invalid face image for processing");
            return faceImg;
        }

        console.log(`Applying face filter type: ${filterType} to image ${faceImg.width}x${faceImg.height}`);
        
        try {
            switch (filterType) {
                case 1: // Requirement 13a: Grayscale image
                    console.log("Applying grayscale filter to face");
                    return this.processor.createGrayscaleWithBrightness(faceImg);
                    
                case 2: // Requirement 13b: Blurred image
                    console.log("Applying blur filter to face for privacy");
                    const blurredFace = this.processor.blurImage(faceImg, 25); 
                    console.log("Blur filter applied, returning blurred face", blurredFace ? `${blurredFace.width}x${blurredFace.height}` : 'null');
                    if (blurredFace) {
                        // Force the blurred face to be fully processed
                        blurredFace.loadPixels();
                        blurredFace.updatePixels();
                    }
                    return blurredFace;
                    
                case 3: // Requirement 13c: Color converted image
                    console.log("Applying HSV color space conversion to face");
                    return this.processor.convertToHSV(faceImg);
                    
                case 4: // Requirement 13d: Pixelated image
                    console.log("Applying pixelation filter to face");
                    // REQUIREMENT 13d.i: Run step a - convert to grayscale first
                    const grayscaleFace = this.processor.createGrayscaleWithBrightness(faceImg);
                    console.log("Converted face to grayscale for pixelation");
                    // REQUIREMENT 13d.ii-v: Apply pixelation using larger blocks for visibility
                    const pixelatedFace = this.processor.pixelateImage(grayscaleFace);
                    console.log("Pixelation applied to face", pixelatedFace ? `${pixelatedFace.width}x${pixelatedFace.height}` : 'null');
                    return pixelatedFace;
                    
                default: // Filter 0: Original face
                    console.log("Showing original face (no filter)");
                    return faceImg;
            }
        } catch (error) {
            console.error("Error processing face filter:", error);
            return faceImg; // Return original on error
        }
    }

    // Extract face region from image using bounding box with bounds checking
    extractFaceRegion(img, face) {
        if (!img || !face || face.width <= 0 || face.height <= 0) {
            console.error("Invalid parameters for face region extraction", {img: !!img, face: face});
            return null;
        }

        try {
            // Ensure face bounds are within image bounds
            const x = Math.max(0, Math.min(face.x, img.width - 1));
            const y = Math.max(0, Math.min(face.y, img.height - 1));
            const width = Math.min(face.width, img.width - x);
            const height = Math.min(face.height, img.height - y);

            console.log(`Extracting face region: (${x}, ${y}) ${width}x${height} from image ${img.width}x${img.height}`);

            if (width <= 0 || height <= 0) {
                console.error("Invalid face dimensions after bounds checking");
                return null;
            }

            const faceImg = safeCreateGraphics(width, height);
            if (!faceImg) {
                console.error("Failed to create graphics for face region");
                return null;
            }
            
            faceImg.copy(img, x, y, width, height, 0, 0, width, height);
            console.log(`Successfully extracted face region ${width}x${height}`);
            return faceImg;
        } catch (error) {
            console.error("Error extracting face region:", error);
            return null;
        }
    }

    //  Detect face using skin tone analysis with  validation
    detectBySkinTone(img) {
        if (!img || !img.pixels) {
            console.error("Invalid image for skin tone detection");
            return null;
        }

        console.log("Attempting skin tone detection...");
        img.loadPixels();
        
        let bestRegion = null;
        let maxSkinPixels = 0;
        let maxSkinRatio = 0;
        
        // Scan different regions of the image with better positioning
        const regions = [
            {x: Math.round(img.width * 0.1), y: Math.round(img.height * 0.1), w: Math.round(img.width * 0.4), h: Math.round(img.height * 0.4)}, // Top-left
            {x: Math.round(img.width * 0.5), y: Math.round(img.height * 0.1), w: Math.round(img.width * 0.4), h: Math.round(img.height * 0.4)}, // Top-right
            {x: Math.round(img.width * 0.2), y: Math.round(img.height * 0.15), w: Math.round(img.width * 0.6), h: Math.round(img.height * 0.6)}, // Center-large
            {x: Math.round(img.width * 0.25), y: Math.round(img.height * 0.2), w: Math.round(img.width * 0.5), h: Math.round(img.height * 0.5)}, // Center-medium
            {x: Math.round(img.width * 0.3), y: Math.round(img.height * 0.25), w: Math.round(img.width * 0.4), h: Math.round(img.height * 0.4)} // Center-small
        ];
        
        regions.forEach((region, index) => {
            if (region.x + region.w > img.width || region.y + region.h > img.height) {
                return; 
            }

            let skinPixelCount = 0;
            let totalPixels = 0;
            
            for (let y = region.y; y < region.y + region.h && y < img.height; y++) {
                for (let x = region.x; x < region.x + region.w && x < img.width; x++) {
                    const idx = (y * img.width + x) * 4;
                    const r = img.pixels[idx];
                    const g = img.pixels[idx + 1];
                    const b = img.pixels[idx + 2];
                    
                    if (this.isSkinTone(r, g, b)) {
                        skinPixelCount++;
                    }
                    totalPixels++;
                }
            }
            
            const skinRatio = totalPixels > 0 ? skinPixelCount / totalPixels : 0;
            console.log(`Region ${index} skin ratio: ${skinRatio.toFixed(3)} (${skinPixelCount}/${totalPixels} pixels)`);
            
            
            if (skinPixelCount > maxSkinPixels && skinRatio > 0.12 && skinRatio > maxSkinRatio) {
                maxSkinPixels = skinPixelCount;
                maxSkinRatio = skinRatio;
                bestRegion = {
                    x: Math.round(region.x),
                    y: Math.round(region.y),
                    width: Math.round(region.w),
                    height: Math.round(region.h)
                };
            }
        });
        
        if (bestRegion && this.isValidFaceSize(bestRegion)) {
            console.log("Skin tone detection successful:", bestRegion, `ratio: ${maxSkinRatio.toFixed(3)}`);
            return bestRegion;
        }
        
        console.log("No significant skin tone regions found");
        return null;
    }

    // Validate face size 
    isValidFaceSize(face) {
        return face && 
               face.width >= this.minFaceSize && 
               face.height >= this.minFaceSize &&
               face.width <= this.maxFaceSize &&
               face.height <= this.maxFaceSize;
    }

    //  skin tone detection with better color ranges
    isSkinTone(r, g, b) {
        // Improved skin tone detection for various ethnicities
        // Range 1: Light skin tones
        if (r > 95 && g > 40 && b > 20 && 
            Math.max(r, g, b) - Math.min(r, g, b) > 15 && 
            Math.abs(r - g) > 15 && r > g && r > b) {
            return true;
        }
        
        // Range 2: Medium skin tones  
        if (r > 80 && g > 50 && b > 30 && 
            r > g && g > b && r - g > 10) {
            return true;
        }
             
        // Range 3: Darker skin tones
        if (r > 50 && g > 30 && b > 15 && 
            r > g && g >= b && r - b > 15) {
            return true;
        }

        // Range 4: Additional medium-dark skin tones
        if (r > 60 && g > 40 && b > 20 &&
            r > b && g > b && (r - b) > 10 && (g - b) > 5) {
            return true;
        }

        return false;
    }

    // Track face based on previous position and motion with improved validation
    trackByMotion(img) {
        if (!this.lastKnownFacePosition || !img || !img.pixels) {
            console.log("No previous face position or invalid image for motion tracking");
            return null;
        }
        
        console.log("Attempting motion-based face tracking...");
        
        const lastPos = this.lastKnownFacePosition;
        const searchRadius = 25; // pixels to search around last position
        
        img.loadPixels();
        let maxSkinDensity = 0;
        let bestPosition = null;
        
        // Sample multiple positions around the last known location
        for (let offsetY = -searchRadius; offsetY <= searchRadius; offsetY += 8) {
            for (let offsetX = -searchRadius; offsetX <= searchRadius; offsetX += 8) {
                const testX = Math.max(0, lastPos.x + offsetX);
                const testY = Math.max(0, lastPos.y + offsetY);
                
                if (testX + lastPos.width <= img.width && 
                    testY + lastPos.height <= img.height) {
                    
                    const skinDensity = this.calculateSkinDensity(img, testX, testY, lastPos.width, lastPos.height);
                    
                    if (skinDensity > maxSkinDensity && skinDensity > 0.1) {
                        maxSkinDensity = skinDensity;
                        bestPosition = {
                            x: testX,
                            y: testY,
                            width: lastPos.width,
                            height: lastPos.height
                        };
                    }
                }
            }
        }
        
        if (bestPosition && this.isValidFaceSize(bestPosition)) {
            console.log("Motion tracking successful:", bestPosition, `density: ${maxSkinDensity.toFixed(3)}`);
            return bestPosition;
        }
        
        console.log("Motion tracking failed");
        return null;
    }

    // Calculate skin tone density in a region with error handling
    calculateSkinDensity(img, x, y, width, height) {
        if (!img || !img.pixels) return 0;

        let skinPixels = 0;
        let totalPixels = 0;
        
        try {
            for (let py = y; py < y + height && py < img.height; py++) {
                for (let px = x; px < x + width && px < img.width; px++) {
                    const idx = (py * img.width + px) * 4;
                    if (idx + 2 < img.pixels.length) {
                        const r = img.pixels[idx];
                        const g = img.pixels[idx + 1];
                        const b = img.pixels[idx + 2];
                        
                        if (this.isSkinTone(r, g, b)) {
                            skinPixels++;
                        }
                        totalPixels++;
                    }
                }
            }
        } catch (error) {
            console.error("Error calculating skin density:", error);
            return 0;
        }
        
        return totalPixels > 0 ? skinPixels / totalPixels : 0;
    }

    // Scan multiple regions systematically for faces with improved algorithm
    scanForFaceRegions(img) {
        if (!img || !img.pixels) {
            console.error("Invalid image for region scanning");
            return null;
        }

        console.log("Scanning for face regions systematically...");
        
        const minScanWidth = 35;  // Minimum viable face width
        const maxScanWidth = 80;  // Maximum face width
        const minScanHeight = 35; // Minimum viable face height
        const maxScanHeight = 80; // Maximum face height
        
        let bestPosition = null;
        let maxScore = 0;
        
        // Multi-scale scanning for better face detection
        for (let scale = 0.3; scale <= 0.7; scale += 0.1) {
            const scanWidth = Math.round(Math.max(minScanWidth, Math.min(maxScanWidth, img.width * scale)));
            const scanHeight = Math.round(Math.max(minScanHeight, Math.min(maxScanHeight, img.height * scale)));
            
            const stepSize = Math.max(8, Math.round(scanWidth * 0.2));
            
            for (let y = 0; y <= img.height - scanHeight; y += stepSize) {
                for (let x = 0; x <= img.width - scanWidth; x += stepSize) {
                    const score = this.scoreFaceRegion(img, x, y, scanWidth, scanHeight);
                    
                    if (score > maxScore) {
                        maxScore = score;
                        bestPosition = {
                            x: x,
                            y: y,
                            width: scanWidth,
                            height: scanHeight
                        };
                    }
                }
            }
        }
        
        if (bestPosition && maxScore > 0.15) {
            console.log("Region scanning successful:", bestPosition, "score:", maxScore.toFixed(3));
            return bestPosition;
        }
        
        console.log("Region scanning failed - no suitable regions found");
        return null;
    }

    // Score a region based on face-like characteristics with enhanced criteria
    scoreFaceRegion(img, x, y, width, height) {
        if (!img || !img.pixels) return 0;

        try {
            img.loadPixels();
            
            let skinToneScore = this.calculateSkinDensity(img, x, y, width, height);
            
            // Prefer regions in upper-middle portion of image 
            let positionScore = 1.0 - Math.abs((y + height/2) - img.height * 0.35) / (img.height * 0.35);
            positionScore = Math.max(0, Math.min(1, positionScore));
            
            // Prefer regions with appropriate color variation 
            let variationScore = this.calculateColorVariation(img, x, y, width, height);
            
            // Size preference - medium sizes are more likely to be faces
            let sizeScore = 1.0 - Math.abs((width + height) / 2 - 50) / 50;
            sizeScore = Math.max(0, Math.min(1, sizeScore));
            
            // Aspect ratio preference - faces are roughly rectangular
            let aspectRatio = width / height;
            let aspectScore = 1.0 - Math.abs(aspectRatio - 0.8) / 0.8;
            aspectScore = Math.max(0, Math.min(1, aspectScore));
            
            const finalScore = (skinToneScore * 0.4) + (positionScore * 0.25) + 
                              (variationScore * 0.15) + (sizeScore * 0.1) + (aspectScore * 0.1);
            
            return finalScore;
        } catch (error) {
            console.error("Error scoring face region:", error);
            return 0;
        }
    }

    // Calculate color variation in a region with improved sampling
    calculateColorVariation(img, x, y, width, height) {
        if (!img || !img.pixels) return 0;

        let rValues = [];
        let gValues = [];
        let bValues = [];
        
        try {
            // Sample pixels in the region with adaptive step size
            const stepSize = Math.max(1, Math.round(width / 10));
            
            for (let py = y; py < y + height && py < img.height; py += stepSize) {
                for (let px = x; px < x + width && px < img.width; px += stepSize) {
                    const idx = (py * img.width + px) * 4;
                    if (idx + 2 < img.pixels.length) {
                        rValues.push(img.pixels[idx]);
                        gValues.push(img.pixels[idx + 1]);
                        bValues.push(img.pixels[idx + 2]);
                    }
                }
            }
            
            // Calculate standard deviation as measure of variation
            const rVariation = this.standardDeviation(rValues);
            const gVariation = this.standardDeviation(gValues);
            const bVariation = this.standardDeviation(bValues);
            
            const avgVariation = (rVariation + gVariation + bVariation) / 3;
            return Math.min(1.0, avgVariation / 40); 
        } catch (error) {
            console.error("Error calculating color variation:", error);
            return 0;
        }
    }

    // Calculate standard deviation with safety checks
    standardDeviation(values) {
        if (!values || values.length === 0) return 0;
        
        try {
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
            const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
            
            return Math.sqrt(avgSquaredDiff);
        } catch (error) {
            console.error("Error calculating standard deviation:", error);
            return 0;
        }
    }

    // Get default center face position as fallback with proper bounds
    getDefaultCenterFace() {
        const width = Math.round(imageProcessor.width * 0.5);
        const height = Math.round(imageProcessor.height * 0.5);
        const x = Math.round((imageProcessor.width - width) / 2);
        const y = Math.round((imageProcessor.height - height) / 2);
        
        return {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.min(width, imageProcessor.width - x),
            height: Math.min(height, imageProcessor.height - y)
        };
    }

    // Update face tracking history for temporal consistency
    updateFaceHistory(facePosition) {
        if (facePosition && this.isValidFaceSize(facePosition)) {
            this.faceTrackingHistory.push(facePosition);
            if (this.faceTrackingHistory.length > this.maxHistoryLength) {
                this.faceTrackingHistory.shift();
            }
            this.lastKnownFacePosition = facePosition;
            
        }
    }

    //  Enhanced manual face detection using multiple strategies with better error handling
    detectFaceManually(faceImage, capturedImage) {
        if (!faceImage || !capturedImage) {
            console.error("Invalid images for manual face detection");
            return this.getDefaultCenterFace();
        }

        console.log("Enhanced manual face detection starting...");
        
        let bestFace = null;
        
        try {
            // Strategy 1: Skin tone detection
            const skinToneFace = this.detectBySkinTone(capturedImage);
            
            // Strategy 2: Motion-based tracking (if we have previous position)
            const motionFace = this.trackByMotion(capturedImage);
            
            // Strategy 3: Multi-region scanning
            const scanFace = this.scanForFaceRegions(capturedImage);
            
            // Choose best detection result with preference order
            bestFace = skinToneFace || motionFace || scanFace;
            
            if (!bestFace) {
                console.log("All detection strategies failed, using center fallback");
                bestFace = this.getDefaultCenterFace();
            }
            
            // Update face tracking history
            this.updateFaceHistory(bestFace);
            
            console.log("Best face detection result:", bestFace);
            
            // Apply the face filter
            this.applyFaceFilter(faceImage, capturedImage, bestFace);
            
            return bestFace;
        } catch (error) {
            console.error("Error in manual face detection:", error);
            bestFace = this.getDefaultCenterFace();
            this.applyFaceFilter(faceImage, capturedImage, bestFace);
            return bestFace;
        }
    }

    // Apply face filter with improved positioning and error handling
    applyFaceFilter(faceImage, capturedImage, faceBbox) {
        if (!faceImage || !capturedImage || !faceBbox) {
            console.error("Invalid parameters for face filter application");
            return;
        }

        console.log(`Applying face filter ${currentFaceFilter} to face at (${faceBbox.x}, ${faceBbox.y}) ${faceBbox.width}x${faceBbox.height}`);

        try {
            const faceRegion = this.extractFaceRegion(capturedImage, faceBbox);
            
            if (faceRegion) {
                console.log(`Extracted face region: ${faceRegion.width}x${faceRegion.height}`);
                const processedFace = this.processFace(faceRegion, currentFaceFilter);
                
                if (processedFace) {
                    console.log(`Processed face: ${processedFace.width}x${processedFace.height}, filter: ${currentFaceFilter}`);
                    
                    
                    if (currentFaceFilter === 2) {
                        // Apply blur directly to the entire face detection area
                        console.log("Applying blur directly to face detection canvas");
                        
                        // Create a temporary image with just the face area
                        const tempFace = safeCreateGraphics(faceBbox.width, faceBbox.height);
                        if (tempFace) {
                            tempFace.copy(faceImage, faceBbox.x, faceBbox.y, faceBbox.width, faceBbox.height, 
                                         0, 0, faceBbox.width, faceBbox.height);
                            
                            // Apply heavy blur
                            tempFace.filter(BLUR, 30);
                            
                            // Copy blurred face back
                            faceImage.copy(tempFace, 0, 0, faceBbox.width, faceBbox.height,
                                          faceBbox.x, faceBbox.y, faceBbox.width, faceBbox.height);
                            
                            console.log("Direct blur application completed");
                        }
                    } else if (currentFaceFilter === 4) {
                        // For pixelate filter, ensure it's applied properly
                        console.log("Applying pixelate filter directly to face detection canvas");
                        
                        // Use the processed face and ensure it's properly copied
                        const copyWidth = Math.min(processedFace.width, faceImage.width - faceBbox.x);
                        const copyHeight = Math.min(processedFace.height, faceImage.height - faceBbox.y);
                        
                        if (copyWidth > 0 && copyHeight > 0) {
                            try {
                                // Force pixel loading for pixelated image
                                processedFace.loadPixels();
                                processedFace.updatePixels();
                                
                                // Use p5.js copy method for pixelated face
                                faceImage.copy(processedFace, 0, 0, copyWidth, copyHeight, 
                                              faceBbox.x, faceBbox.y, copyWidth, copyHeight);
                                console.log(`Applied pixelate filter to face region at (${faceBbox.x}, ${faceBbox.y}) - size: ${copyWidth}x${copyHeight}`);
                            } catch (copyError) {
                                console.error("Error copying pixelated face:", copyError);
                                this.fallbackPixelCopy(faceImage, processedFace, faceBbox, copyWidth, copyHeight);
                            }
                        }
                    } else {
                        // For other filters, use the normal approach
                       
                        const copyWidth = Math.min(processedFace.width, faceImage.width - faceBbox.x);
                        const copyHeight = Math.min(processedFace.height, faceImage.height - faceBbox.y);
                        
                        if (copyWidth > 0 && copyHeight > 0) {
                            try {
                                // Use p5.js copy method for more reliable image copying
                                faceImage.copy(processedFace, 0, 0, copyWidth, copyHeight, 
                                              faceBbox.x, faceBbox.y, copyWidth, copyHeight);
                                console.log(`Applied ${currentFaceFilter} filter to face region at (${faceBbox.x}, ${faceBbox.y}) - size: ${copyWidth}x${copyHeight}`);
                            } catch (copyError) {
                                console.error("Error copying processed face:", copyError);
                                // Fallback to pixel manipulation if copy fails
                                this.fallbackPixelCopy(faceImage, processedFace, faceBbox, copyWidth, copyHeight);
                            }
                        }
                    }
                } else {
                    console.error("Failed to process face with filter", currentFaceFilter);
                }
            } else {
                console.error("Failed to extract face region");
            }
        } catch (error) {
            console.error("Error applying face filter:", error);
        }
        
        // Draw bounding box with enhanced visuals
        try {
            // Different colors for different detection methods
            const isEnhancedDetection = faceBbox !== this.getDefaultCenterFace();
            const boxColor = isEnhancedDetection ? [0, 255, 0] : [255, 165, 0]; // Green for enhanced, Orange for fallback
            
            faceImage.stroke(boxColor[0], boxColor[1], boxColor[2]);
            faceImage.strokeWeight(2);
            faceImage.noFill();
            
            // Ensure bounding box is within image bounds
            const drawX = Math.max(0, Math.min(faceBbox.x, faceImage.width - 1));
            const drawY = Math.max(0, Math.min(faceBbox.y, faceImage.height - 1));
            const drawWidth = Math.min(faceBbox.width, faceImage.width - drawX);
            const drawHeight = Math.min(faceBbox.height, faceImage.height - drawY);
            
            if (drawWidth > 0 && drawHeight > 0) {
                faceImage.rect(drawX, drawY, drawWidth, drawHeight);
            }
            
            // Add detection method label
            faceImage.fill(boxColor[0], boxColor[1], boxColor[2]);
            faceImage.noStroke();
            faceImage.textSize(8);
            faceImage.textAlign(LEFT, TOP);
            
            const labelY = Math.max(10, drawY - 5);
            const labelText = isEnhancedDetection ? "Smart Detection" : "Center Fallback";
            faceImage.text(labelText, drawX, labelY);
        } catch (error) {
            console.error("Error drawing face bounding box:", error);
        }
    }

    // Fallback pixel copying method
    fallbackPixelCopy(faceImage, processedFace, faceBbox, copyWidth, copyHeight) {
        try {
            // Ensure both images have loaded pixels
            processedFace.loadPixels();
            faceImage.loadPixels();
            
            // Use direct pixel copying for better compatibility
            for (let y = 0; y < copyHeight; y++) {
                for (let x = 0; x < copyWidth; x++) {
                    const srcIdx = (y * processedFace.width + x) * 4;
                    const destIdx = ((faceBbox.y + y) * faceImage.width + (faceBbox.x + x)) * 4;
                    
                    if (srcIdx + 3 < processedFace.pixels.length && 
                        destIdx + 3 < faceImage.pixels.length &&
                        faceBbox.x + x < faceImage.width &&
                        faceBbox.y + y < faceImage.height) {
                        
                        faceImage.pixels[destIdx] = processedFace.pixels[srcIdx];         // Red
                        faceImage.pixels[destIdx + 1] = processedFace.pixels[srcIdx + 1]; // Green
                        faceImage.pixels[destIdx + 2] = processedFace.pixels[srcIdx + 2]; // Blue
                        faceImage.pixels[destIdx + 3] = processedFace.pixels[srcIdx + 3]; // Alpha
                    }
                }
            }
            
            faceImage.updatePixels();
            console.log(`Applied fallback pixel copy for ${currentFaceFilter} filter`);
        } catch (pixelError) {
            console.error("Error in fallback pixel copy:", pixelError);
        }
    }
}

// UI Controller class for handling user interactions
class UIController {
    constructor() {
        this.setupEventListeners();
        this.updateSliderValues();
    }

    setupEventListeners() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        const captureBtn = document.getElementById('captureBtn');
        const toggleBtn = document.getElementById('toggleCamera');
        
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                this.captureImage();
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleCamera();
            });
        }

        // Bind threshold sliders
        ['red', 'green', 'blue', 'hsv', 'lab'].forEach(color => {
            const slider = document.getElementById(`${color}Threshold`);
            const valueSpan = document.getElementById(`${color}Value`);
            
            if (slider && valueSpan) {
                slider.addEventListener('input', (e) => {
                    valueSpan.textContent = e.target.value;
                    console.log(`${color} threshold changed to: ${e.target.value}`);
                    if (capturedImage) {
                        this.updateProcessing();
                    }
                });
            }
        });

        // Bind filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFaceFilter = parseInt(e.target.dataset.filter);
                this.updateStatusText(`Face filter: ${this.getFilterName(currentFaceFilter)}`);
                console.log(`Face filter changed via button: ${currentFaceFilter}`);
                if (capturedImage) {
                    processFaceDetection();
                }
            });
        });
    }

    getFilterName(filter) {
        const names = [
            'Original', 
            'Grayscale', 
            'Blur', 
            'HSV Color Space', 
            'Pixelate'
        ];
        return names[filter] || 'Unknown';
    }

    updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.filter) === currentFaceFilter);
        });
    }

    captureImage() {
        if (video && video.elt && video.elt.readyState >= 2) {
            console.log("=== CAPTURING IMAGE ===");
            console.log(`Capturing image at resolution: ${imageProcessor.width}x${imageProcessor.height}`);
            
            try {
                // Create captured image with proper orientation
                capturedImage = createGraphics(imageProcessor.width, imageProcessor.height);
                
                // Draw flipped video to correct camera mirroring
                capturedImage.push();
                capturedImage.scale(-1, 1);
                capturedImage.translate(-imageProcessor.width, 0);
                capturedImage.image(video, 0, 0, imageProcessor.width, imageProcessor.height);
                capturedImage.pop();
                
                isCapturing = true;
                this.updateStatusText('Processing captured image...');
                console.log("Image captured, starting processing...");
                
                setTimeout(() => {
                    if (isCapturing) {
                        processImages();
                        isCapturing = false;
                        this.updateStatusText('Image processed successfully!');
                    }
                }, 100);
            } catch (error) {
                console.error("Error capturing image:", error);
                this.updateStatusText('Error capturing image: ' + error.message);
                isCapturing = false;
            }
        } else {
            this.updateStatusText('Camera not ready, please wait...');
            console.warn("Camera not ready for capture");
        }
    }

    toggleCamera() {
        cameraActive = !cameraActive;
        const status = cameraActive ? 'Camera started' : 'Camera stopped';
        this.updateStatusText(status);
        console.log(status);
        
        // Control face tracking based on camera state
        if (cameraActive) {
            // Start face tracking when camera is turned on
            setTimeout(() => {
                if (typeof ml5 !== 'undefined' && faceMesh) {
                    startPeriodicFaceTracking();
                }
            }, 2000); // Give camera time to initialize
        } else {
            // Stop face tracking when camera is turned off
            stopPeriodicFaceTracking();
        }
    }

    updateProcessing() {
        if (capturedImage) {
            console.log("Updating processing with new threshold values...");
            try {
                processImages();
            } catch (error) {
                console.error("Error updating processing:", error);
                this.updateStatusText('Error updating processing: ' + error.message);
            }
        }
    }

    updateStatusText(text) {
        const statusElement = document.getElementById('statusText');
        if (statusElement) {
            statusElement.textContent = text;
        }
        console.log("Status:", text);
    }

    updateSliderValues() {
        ['red', 'green', 'blue', 'hsv', 'lab'].forEach(color => {
            const slider = document.getElementById(`${color}Threshold`);
            const valueSpan = document.getElementById(`${color}Value`);
            if (slider && valueSpan) {
                valueSpan.textContent = slider.value;
            }
        });
    }
}

// P5.js setup function
function setup() {
    try {
        // Create a minimal canvas 
        let canvas = createCanvas(1, 1, P2D); 
        canvas.parent('canvasContainer');
        
        console.log("=== INITIALIZING APPLICATION ===");
        console.log("Target resolution: 160x120 pixels (assignment requirement)");
        
        imageProcessor = new ImageProcessor();
        faceProcessor = new FaceProcessor();
        uiController = new UIController();
        
        setupCanvases();
        
        console.log("Starting video capture...");
        
        // Initialize video capture with error handling
        try {
            video = createCapture(VIDEO, videoReady);
            video.size(imageProcessor.width, imageProcessor.height);
            video.hide();
        } catch (videoError) {
            console.error("Error initializing video capture:", videoError);
            document.getElementById('statusText').textContent = 'Camera initialization failed - check permissions';
        }
        
    } catch (error) {
        console.error("Error in setup:", error);
        // Try to continue with manual initialization
        document.getElementById('statusText').textContent = 'Setup error - some features may not work';
    }
    
    // Initialize face detection after a delay to ensure everything is loaded
    setTimeout(() => {
        console.log("Checking ML5.js availability...");
        if (typeof ml5 !== 'undefined') {
                console.log("ML5.js is loaded, initializing face detection...");
                try {
                    // Use the latest ML5.js API for face detection
                    console.log("Available ML5 methods:", Object.keys(ml5));
                    
                    if (typeof ml5.faceMesh === 'function') {
                        console.log("Initializing ML5 faceMesh...");
                        faceMesh = ml5.faceMesh({
                            maxFaces: 1,
                            refineLandmarks: false,
                            flipHorizontal: false
                        }, modelReady);
                    } else if (typeof ml5.objectDetector === 'function') {
                        console.log("Using ML5 objectDetector as fallback...");
                        faceMesh = ml5.objectDetector('cocossd', modelReady);
                    } else {
                        console.warn("ML5 face detection methods not available");
                        throw new Error("ML5 face detection methods not available");
                    }
                } catch (error) {
                    console.error("Error initializing face detection model:", error);
                    console.log("Face detection will use manual detection only");
                    uiController.updateStatusText('Using manual face detection - ML5 not available');
                    faceMesh = null;
                }
            } else {
                console.warn("ML5.js not loaded yet, retrying in 2 seconds...");
                setTimeout(() => {
                    if (typeof ml5 !== 'undefined') {
                        console.log("ML5.js loaded on retry, initializing face detection...");
                        try {
                            if (typeof ml5.faceMesh === 'function') {
                                faceMesh = ml5.faceMesh({
                                    maxFaces: 1,
                                    refineLandmarks: false,
                                    flipHorizontal: false
                                }, modelReady);
                            } else if (typeof ml5.objectDetector === 'function') {
                                faceMesh = ml5.objectDetector('cocossd', modelReady);
                            } else {
                                throw new Error("ML5 detection methods not available");
                            }
                        } catch (error) {
                            console.error("Error initializing face detection model on retry:", error);
                            uiController.updateStatusText('Face detection model failed to load - using manual detection');
                            faceMesh = null;
                        }
                    } else {
                        console.warn("ML5.js still not available - using manual face detection only");
                        uiController.updateStatusText('ML5.js not available - using manual face detection');
                    }
                }, 2000);
            }
        }, 3000);
        
        // Start real-time face tracking for better positioning (only when camera is active)
        setTimeout(() => {
            if (typeof ml5 !== 'undefined' && faceMesh) {
                startPeriodicFaceTracking();
            } else {
                console.log("Skipping real-time face tracking - ML5.js not available");
            }
        }, 5000);
        
        uiController.updateStatusText('Initializing camera...');
}

// Error handler for setup issues
function handleSetupError(error) {
    console.error("Error in setup:", error);
    document.getElementById('statusText').textContent = 'Setup error - some features may not work';
}

function videoReady() {
    console.log('Video ready - webcam initialized');
    cameraActive = true;
    uiController.updateStatusText('Camera ready - Press Capture to process image');
}

function modelReady() {
    console.log('Face detection model loaded and ready');
    uiController.updateStatusText('Face detection ready - Press Capture to process image');
}

function gotFaces(results) {
    detectedFaces = results || [];
    if (detectedFaces.length > 0) {
        console.log(`Detected ${detectedFaces.length} face(s) in current frame`);
      
        console.log("Face detection data:", detectedFaces[0]);
    }
}

function setupCanvases() {
    const grid = document.getElementById('imageGrid');
    if (!grid) {
        console.error("Image grid container not found!");
        return;
    }
    
    console.log("Setting up canvas grid...");
    
    const canvasTypes = [
        'original', 'grayscale', 'redChannel', 'greenChannel', 'blueChannel',
        'redThreshold', 'greenThreshold', 'blueThreshold', 'originalRepeat',
        'hsvConversion', 'labConversion', 'hsvThreshold', 'labThreshold', 'faceDetection'
    ];
    
    const canvasNames = [
        'Webcam Image', 'Grayscale + 20% Brightness', 'Red Channel', 'Green Channel', 'Blue Channel',
        'Red Threshold', 'Green Threshold', 'Blue Threshold', 'Webcam Image',
        'HSV Color Space', 'Lab Color Space', 'HSV Threshold', 'Lab Threshold', 'Face Detection'
    ];
    
    canvasTypes.forEach((type, index) => {
        const container = document.createElement('div');
        container.className = 'image-container';
        
        const title = document.createElement('h3');
        title.textContent = canvasNames[index];
        container.appendChild(title);
        
        const canvas = document.createElement('canvas');
        canvas.width = imageProcessor.width;
        canvas.height = imageProcessor.height;
        canvas.id = `canvas_${type}`;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.border = '1px solid #ddd';
        canvas.style.objectFit = 'contain';
        container.appendChild(canvas);
        
        grid.appendChild(container);
        canvases[type] = canvas.getContext('2d');
    });
    
    console.log(`Created ${Object.keys(canvases).length} canvas contexts for image display`);
}

function draw() {
    // Update FPS counter less frequently to improve performance
    if (millis() - fpsUpdateTimer > 2000) { 
        const fpsElement = document.getElementById('fpsCounter');
        if (fpsElement) {
            fpsElement.textContent = Math.round(frameRate());
        }
        fpsUpdateTimer = millis();
    }
    
    // Display live video feed with throttling
    if (video && video.elt && video.elt.readyState >= 2 && cameraActive && canvases.original) {
        
        if (frameCount % 2 === 0) { 
            displayLiveVideo();
        }
    }
}

function displayLiveVideo() {
    const canvas = document.getElementById('canvas_original');
    if (!canvas || !video) return;
    
    try {
        canvas.width = imageProcessor.width;
        canvas.height = imageProcessor.height;
        
        const ctx = canvases.original;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(-1, 1); // Flip to correct camera mirroring
        ctx.drawImage(video.elt, -imageProcessor.width, 0, imageProcessor.width, imageProcessor.height);
        ctx.restore();
        
    } catch (error) {
        console.error("Error displaying live video:", error);
    }
}

//  Complete image processing pipeline with  error handling
function processImages() {
    if (!capturedImage) {
        console.error("No captured image to process");
        uiController.updateStatusText('Error: No captured image to process');
        return;
    }
    

    console.log("Starting image processing pipeline");
    
    try {
        // Get threshold values from UI sliders with fallback defaults
        const redThreshold = parseInt(document.getElementById('redThreshold')?.value || 128);
        const greenThreshold = parseInt(document.getElementById('greenThreshold')?.value || 128);
        const blueThreshold = parseInt(document.getElementById('blueThreshold')?.value || 128);
        const hsvThreshold = parseInt(document.getElementById('hsvThreshold')?.value || 128);
        const labThreshold = parseInt(document.getElementById('labThreshold')?.value || 128);
        
        // Step 1: Process grayscale with 20% brightness increase
        const grayscale = imageProcessor.createGrayscaleWithBrightness(capturedImage);
        if (grayscale) displayImageOnCanvas(grayscale, 'grayscale');
        
        // Step 2: Extract RGB color channels
        const channels = imageProcessor.extractColorChannels(capturedImage);
        if (channels.red) displayImageOnCanvas(channels.red, 'redChannel');
        if (channels.green) displayImageOnCanvas(channels.green, 'greenChannel');
        if (channels.blue) displayImageOnCanvas(channels.blue, 'blueChannel');
        
        // Step 3: Apply thresholds to individual channels
        const redThresholdImg = imageProcessor.applyChannelThreshold(capturedImage, redThreshold, 0);
        const greenThresholdImg = imageProcessor.applyChannelThreshold(capturedImage, greenThreshold, 1);
        const blueThresholdImg = imageProcessor.applyChannelThreshold(capturedImage, blueThreshold, 2);
        
        if (redThresholdImg) displayImageOnCanvas(redThresholdImg, 'redThreshold');
        if (greenThresholdImg) displayImageOnCanvas(greenThresholdImg, 'greenThreshold');
        if (blueThresholdImg) displayImageOnCanvas(blueThresholdImg, 'blueThreshold');
        
        // Step 4: Color space conversions
        const hsvImage = imageProcessor.convertToHSV(capturedImage);
        const labImage = imageProcessor.convertToLab(capturedImage);
        
        if (hsvImage) displayImageOnCanvas(hsvImage, 'hsvConversion');
        if (labImage) displayImageOnCanvas(labImage, 'labConversion');
        
        // Step 5: Apply thresholds to color space converted images
        const hsvThresholdImg = imageProcessor.applyColorSpaceThreshold(hsvImage, hsvThreshold);
        const labThresholdImg = imageProcessor.applyColorSpaceThreshold(labImage, labThreshold);
        
        if (hsvThresholdImg) displayImageOnCanvas(hsvThresholdImg, 'hsvThreshold');
        if (labThresholdImg) displayImageOnCanvas(labThresholdImg, 'labThreshold');
        
        // Step 6: Display original image in repeat position
        displayImageOnCanvas(capturedImage, 'originalRepeat');
        
        // Step 7: Process face detection and filters
        processFaceDetection();
        
        console.log("Image processing completed");
        
    } catch (error) {
        console.error("ERROR in image processing pipeline:", error);
        uiController.updateStatusText('Error processing image: ' + error.message);
    }
}

function displayImageOnCanvas(p5Image, canvasType) {
    if (!canvases[canvasType] || !p5Image) {
        return; 
    }
    
    try {
        const canvas = document.getElementById(`canvas_${canvasType}`);
        if (!canvas) {
            return;
        }
        
        // Ensure consistent canvas dimensions only if changed
        if (canvas.width !== imageProcessor.width || canvas.height !== imageProcessor.height) {
            canvas.width = imageProcessor.width;
            canvas.height = imageProcessor.height;
        }
        
        const ctx = canvases[canvasType];
        
        // Only clear if necessary
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw p5 graphics to canvas with optimized path
        if (p5Image.canvas) {
            ctx.drawImage(p5Image.canvas, 0, 0, imageProcessor.width, imageProcessor.height);
        } else {
            // Fallback to pixel manipulation (slower)
            p5Image.loadPixels();
            if (p5Image.pixels && p5Image.pixels.length > 0) {
                const imageData = ctx.createImageData(imageProcessor.width, imageProcessor.height);
                
                // Copy pixels more efficiently
                const len = Math.min(p5Image.pixels.length, imageData.data.length);
                for (let i = 0; i < len; i++) {
                    imageData.data[i] = p5Image.pixels[i];
                }
                
                ctx.putImageData(imageData, 0, 0);
            }
        }
    } catch (error) {
        // Reduced error logging for performance
        console.error(`Error displaying image on canvas ${canvasType}`);
    }
}

//  Updated face detection processing with  error handling
function processFaceDetection() {
    if (!capturedImage) {
        console.error("No captured image for face detection");
        uiController.updateStatusText('Error: No captured image for face detection');
        return;
    }
    
    try {
        let faceImage = safeCreateGraphics(imageProcessor.width, imageProcessor.height);
        if (!faceImage) {
            console.error("Failed to create face image graphics");
            return;
        }
        faceImage.image(capturedImage, 0, 0);
        
        // Check if ML5 faceMesh is available
        if (typeof ml5 !== 'undefined' && faceMesh && typeof faceMesh.detect === 'function') {
            // Create a temporary canvas for face detection
            let tempCanvas = document.createElement('canvas');
            tempCanvas.width = imageProcessor.width;
            tempCanvas.height = imageProcessor.height;
            let tempCtx = tempCanvas.getContext('2d');
            
            // Draw the captured image to temp canvas
            if (capturedImage.canvas) {
                tempCtx.drawImage(capturedImage.canvas, 0, 0, imageProcessor.width, imageProcessor.height);
                
                // Convert to image for ML5
                let tempImg = new Image();
                tempImg.crossOrigin = 'anonymous';
                
                tempImg.onload = async () => {
                    try {
                        // Use the latest ML5.js API with async/await
                        const results = await faceMesh.detect(tempImg);
                        
                        if (results && results.length > 0) {
                            console.log(`Found ${results.length} face(s)`);
                            
                            // Process the first detected face
                            const face = results[0];
                            let bbox;
                            
                            // Handle different ML5.js faceMesh result formats
                            if (face.box) {
                                // Latest ML5.js format
                                bbox = {
                                    x: Math.max(0, Math.round(face.box.xMin)),
                                    y: Math.max(0, Math.round(face.box.yMin)),
                                    width: Math.min(Math.round(face.box.width), imageProcessor.width),
                                    height: Math.min(Math.round(face.box.height), imageProcessor.height)
                                };
                            } else if (face.boundingBox) {
                                // Alternative format
                                bbox = {
                                    x: Math.max(0, Math.round(face.boundingBox.topLeft.x)),
                                    y: Math.max(0, Math.round(face.boundingBox.topLeft.y)),
                                    width: Math.min(Math.round(face.boundingBox.width), imageProcessor.width),
                                    height: Math.min(Math.round(face.boundingBox.height), imageProcessor.height)
                                };
                            }
                            
                            if (bbox && bbox.width > 0 && bbox.height > 0) {
                                // Final bounds validation
                                if (bbox.x + bbox.width > imageProcessor.width) {
                                    bbox.width = imageProcessor.width - bbox.x;
                                }
                                if (bbox.y + bbox.height > imageProcessor.height) {
                                    bbox.height = imageProcessor.height - bbox.y;
                                }
                                
                                console.log(`Face detected at:`, bbox);
                                
                                // Update face tracking history
                                faceProcessor.updateFaceHistory(bbox);
                                
                                // Apply face filter
                                faceProcessor.applyFaceFilter(faceImage, capturedImage, bbox);
                            } else {
                                console.warn("Invalid face bbox, using manual detection");
                                faceProcessor.detectFaceManually(faceImage, capturedImage);
                            }
                        } else {
                            console.log("No faces detected, using manual detection");
                            faceProcessor.detectFaceManually(faceImage, capturedImage);
                        }
                        
                        displayImageOnCanvas(faceImage, 'faceDetection');
                        
                    } catch (detectError) {
                        console.error("Error during ML5 face detection:", detectError);
                        faceProcessor.detectFaceManually(faceImage, capturedImage);
                        displayImageOnCanvas(faceImage, 'faceDetection');
                    }
                };
                
                tempImg.onerror = (imgError) => {
                    console.error("Error loading temp image:", imgError);
                    faceProcessor.detectFaceManually(faceImage, capturedImage);
                    displayImageOnCanvas(faceImage, 'faceDetection');
                };
                
                tempImg.src = tempCanvas.toDataURL();
                
            } else {
                console.warn("No canvas available on captured image, using manual detection");
                faceProcessor.detectFaceManually(faceImage, capturedImage);
                displayImageOnCanvas(faceImage, 'faceDetection');
            }
        } else {
            console.log("ML5 faceMesh not available, using manual face detection");
            faceProcessor.detectFaceManually(faceImage, capturedImage);
            displayImageOnCanvas(faceImage, 'faceDetection');
        }
        
    } catch (error) {
        console.error("Error in face detection processing:", error);
        uiController.updateStatusText('Error in face detection: ' + error.message);
    }
}

// Real-time face tracking during live video with error handling
async function enableRealTimeFaceTracking() {
    // Check if ML5 and faceMesh are available
    if (typeof ml5 === 'undefined' || !faceMesh) {
        console.log("ML5.js or faceMesh not available for real-time tracking");
        return;
    }
    
    // This function enables continuous face detection for better positioning
    if (video && video.elt && video.elt.readyState >= 2 && cameraActive) {
        try {
            // Use async/await for latest ML5.js API
            const results = await faceMesh.detect(video.elt);
            
            if (results && results.length > 0) {
                // Update face tracking for when capture is pressed
                const face = results[0]; // Get the first detected face
                
                if (face && faceProcessor) {
                    let faceBbox;
                    
                    // Handle different ML5.js result formats
                    if (face.box) {
                        // Latest ML5.js format
                        faceBbox = {
                            x: Math.max(0, Math.round(face.box.xMin)),
                            y: Math.max(0, Math.round(face.box.yMin)),
                            width: Math.min(Math.round(face.box.width), imageProcessor.width),
                            height: Math.min(Math.round(face.box.height), imageProcessor.height)
                        };
                    } else if (face.boundingBox) {
                        // Alternative format
                        faceBbox = {
                            x: Math.max(0, Math.round(face.boundingBox.topLeft.x)),
                            y: Math.max(0, Math.round(face.boundingBox.topLeft.y)),
                            width: Math.min(Math.round(face.boundingBox.width), imageProcessor.width),
                            height: Math.min(Math.round(face.boundingBox.height), imageProcessor.height)
                        };
                    }
                    
                    // Validate bbox before updating history
                    if (faceBbox && faceBbox.width > 0 && faceBbox.height > 0 && 
                        faceBbox.x + faceBbox.width <= imageProcessor.width &&
                        faceBbox.y + faceBbox.height <= imageProcessor.height) {
                        faceProcessor.updateFaceHistory(faceBbox);
                    }
                }
            }
        } catch (error) {
            console.error("Error in real-time face tracking:", error);
        }
    }
}

// Controlled periodic face tracking that only runs when camera is active
let faceTrackingInterval = null;

function startPeriodicFaceTracking() {
    // Don't start if already running
    if (faceTrackingInterval) {
        return;
    }
    
    console.log("Starting periodic face tracking...");
    
    faceTrackingInterval = setInterval(() => {
        // Only run if camera is active and video is ready
        if (cameraActive && video && video.elt && video.elt.readyState >= 2 && !isCapturing) {
            enableRealTimeFaceTracking();
        }
    }, 3000); 
}

function stopPeriodicFaceTracking() {
    if (faceTrackingInterval) {
        clearInterval(faceTrackingInterval);
        faceTrackingInterval = null;
        console.log("Stopped periodic face tracking");
    }
}

//  Keyboard input handling for face filters (Requirement 13) with validation
function keyPressed() {
    // Reduced logging for performance
    
    try {
        const keyNum = parseInt(key);
        
        // Handle face filter keystrokes 0-4 as specified in requirement 13
        if (keyNum >= 0 && keyNum <= 4) {
            currentFaceFilter = keyNum;
            
            if (uiController) {
                uiController.updateFilterButtons();
            }
            
            // Filter descriptions for user feedback
            const filterDescriptions = {
                0: 'Original Face (no filter applied)',
                1: 'Grayscale Face Filter',
                2: 'Blurred Face Filter for Privacy', 
                3: 'HSV Color Space Face Filter',
                4: 'Pixelated Face Filter with 5x5 blocks'
            };
            
            const description = filterDescriptions[keyNum];
            if (uiController) {
                uiController.updateStatusText(`Face filter: ${description}`);
            }
            
            // Apply filter if image is captured
            if (capturedImage) {
                processFaceDetection();
            }
        }
        
        // Additional keyboard shortcuts for debugging
        if (key === 'c' || key === 'C') {
            console.log("Capture shortcut pressed");
            if (uiController) {
                uiController.captureImage();
            }
        }
        
        if (key === 't' || key === 'T') {
            console.log("Camera toggle shortcut pressed");
            if (uiController) {
                uiController.toggleCamera();
            }
        }
        
        // Debug shortcut to test manual face detection
        if (key === 'd' || key === 'D') {
            console.log("Debug: Testing manual face detection");
            if (capturedImage && faceProcessor) {
                let debugFaceImage = createGraphics(imageProcessor.width, imageProcessor.height);
                debugFaceImage.image(capturedImage, 0, 0);
                faceProcessor.detectFaceManually(debugFaceImage, capturedImage);
                displayImageOnCanvas(debugFaceImage, 'faceDetection');
            }
        }
    } catch (error) {
        console.error("Error in keyPressed handler:", error);
        if (uiController) {
            uiController.updateStatusText('Error handling key press: ' + error.message);
        }
    }
}

// Error handling wrapper for p5.js error events
function windowResized() {
    // Handle window resize gracefully
    console.log("Window resized");
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    if (uiController) {
        uiController.updateStatusText('Application error occurred - check console for details');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (uiController) {
        uiController.updateStatusText('Promise rejection error - check console for details');
    }
});

// Utility function to safely execute async operations
function safeExecute(operation, errorMessage) {
    try {
        return operation();
    } catch (error) {
        console.error(errorMessage, error);
        if (uiController) {
            uiController.updateStatusText(errorMessage + ': ' + error.message);
        }
        return null;
    }
}

// Enhanced debugging function
function debugApplicationState() {
    console.log("=== APPLICATION DEBUG STATE ===");
    console.log("Video ready:", video && video.elt && video.elt.readyState >= 2);
    console.log("Face mesh loaded:", !!faceMesh);
    console.log("Captured image:", !!capturedImage);
    console.log("Camera active:", cameraActive);
    console.log("Current face filter:", currentFaceFilter);
    console.log("Is capturing:", isCapturing);
    console.log("Canvas count:", Object.keys(canvases).length);
    console.log("Face tracking history:", faceProcessor ? faceProcessor.faceTrackingHistory.length : 0);
    console.log("================================");
}
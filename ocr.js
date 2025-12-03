// OCR functionality using Tesseract.js

// Enhanced OCR function with image preprocessing
async function performOCR(imageFile) {
  try {
    // Create a canvas to preprocess image
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw image on canvas
    ctx.drawImage(img, 0, 0);
    
    // Get image data for preprocessing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply grayscale and contrast enhancement
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const contrast = 1.5;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const adjusted = factor * (gray - 128) + 128;
      
      data[i] = adjusted;     // Red
      data[i + 1] = adjusted; // Green
      data[i + 2] = adjusted; // Blue
      // Alpha channel (data[i + 3]) remains unchanged
    }
    
    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob for OCR
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        try {
          // Use Tesseract with enhanced configuration
          const result = await Tesseract.recognize(
            blob,
            'eng',
            {
              logger: m => console.log(m),
              tessedit_pageseg_mode: Tesseract.PSM.AUTO,
              tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,!?;:()[]{}\'"-@#$%^&*+=<>/\\|`~ '
            }
          );
          
          resolve(result.data.text.trim());
        } catch (error) {
          console.error('OCR Error:', error);
          resolve(null);
        }
      }, 'image/jpeg', 0.95);
    });
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
}

// Process image and extract text with progress feedback
async function processImageWithOCR(imageFile, onProgress = null) {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            onProgress(progress);
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,!?;:()[]{}\'"-@#$%^&*+=<>/\\|`~ '
      }
    );
    
    return result.data.text.trim();
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
}

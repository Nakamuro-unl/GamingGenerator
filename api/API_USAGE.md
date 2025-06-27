# GIF Gaming Effects API Usage

## Overview

The GIF Gaming Effects API processes GIF animations and applies various gaming-themed visual effects. It's implemented in pure Python without dependencies on PIL/Pillow, making it suitable for serverless environments like Vercel.

## API Endpoint

**URL:** `/api/gif-gaming.py`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Request Format

```json
{
  "gifData": "data:image/gif;base64,R0lGODlh...",
  "effect": "rainbow",
  "intensity": 0.8
}
```

### Parameters

- **gifData** (required): Base64-encoded GIF data with data URL prefix
- **effect** (optional): Effect type, defaults to "rainbow"
- **intensity** (optional): Effect intensity from 0.0 to 1.0, defaults to 1.0

### Available Effects

1. **rainbow** - Creates dynamic rainbow color shifts across the GIF
2. **golden** - Applies golden gaming aesthetic with warm color tints
3. **pulse** - Adds pulsing brightness effects
4. **neon** - Cycles through bright neon colors (magenta, cyan, yellow, pink, lime)
5. **glitch** - Adds digital glitch effects with random color corruption

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "GIF processed successfully with rainbow effect",
  "gifData": "data:image/gif;base64,R0lGODlh...",
  "frameCount": 5,
  "effect": "rainbow",
  "intensity": 0.8,
  "processing_info": {
    "width": 64,
    "height": 64,
    "frames_processed": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "GIF processing failed",
  "details": "Error description...",
  "fallback_message": "Using simplified processing",
  "gifData": "data:image/gif;base64,R0lGODlh..."  // Original GIF as fallback
}
```

## Implementation Details

### Pure Python GIF Processing

The API uses a custom pure Python implementation that includes:

- **GIF Decoder**: Parses GIF file structure, color tables, and frame data
- **LZW Decompression**: Implements the LZW algorithm used in GIF compression
- **Gaming Effects Engine**: Applies various visual effects to each frame
- **GIF Encoder**: Reconstructs the processed frames back into GIF format

### Gaming Effects

Each effect is applied frame-by-frame with the following characteristics:

- **Rainbow**: Uses HSV color space to create smooth color transitions
- **Golden**: Enhances warm colors (reds/yellows) while reducing cool colors
- **Pulse**: Modulates brightness using sinusoidal functions
- **Neon**: Cycles through predefined neon colors with glow effects
- **Glitch**: Randomly corrupts color channels for digital artifact simulation

### Performance Considerations

- Processing is CPU-intensive and may take several seconds for large GIFs
- Memory usage scales with GIF dimensions and frame count
- LZW decompression is the most computationally expensive operation
- Effects are applied in-place to minimize memory allocation

## Example Usage (JavaScript)

```javascript
async function processGif(gifFile, effectType = 'rainbow', intensity = 0.8) {
  // Convert file to base64
  const base64 = await fileToBase64(gifFile);
  
  const requestData = {
    gifData: base64,
    effect: effectType,
    intensity: intensity
  };
  
  try {
    const response = await fetch('/api/gif-gaming.py', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Use result.gifData as processed GIF
      return result.gifData;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('GIF processing failed:', error);
    throw error;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

## Testing

The API includes comprehensive test suites:

- `test_gif_processor.py` - Basic functionality tests
- `test_effects.py` - All gaming effects tests

Run tests with:
```bash
python3 test_gif_processor.py
python3 test_effects.py
```

## Error Handling

The API implements graceful error handling:

1. **GIF Parsing Errors**: Falls back to simplified processing
2. **LZW Decompression Failures**: Uses pattern-based fallback
3. **Effect Application Errors**: Returns original GIF with error details
4. **Critical Failures**: Returns structured error response

## Limitations

- Animated GIFs with very large frame counts may timeout
- Complex GIF features (transparency, interlacing) receive simplified handling  
- Performance is not optimized for real-time processing
- No support for GIF metadata preservation beyond basic animation timing
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要な制約

- **日本語で対応すること** - UIテキストやコメントは日本語を維持
- **プロダクション環境** - デバッグ機能は削除済み、リリース準備完了

## Project Overview

This is a web application called "Gaming Generator" (ゲーミングジェネレーター) that creates gaming-themed visual effects. It combines client-side processing with Vercel API for advanced GIF animation processing.

## Architecture & Structure

The project consists of:
- `index.html` - Main HTML with tab-based UI for two generators
- `script.js` - Main JavaScript logic handling both generators
- `styles.css` - All styling including responsive design and dark mode
- `gif.js` & `gif.worker.js` - Third-party library for GIF generation (MIT License)
- `api/gif-gaming.py` - Vercel API for advanced GIF animation processing

## Key Features

1. **Concentration Lines Generator** (集中線ジェネレーター) - Creates manga-style speed lines with gaming effects
2. **Gaming Text/Stamp Generator** (ゲーミングスタンプ) - Creates animated text/image stamps with rainbow effects
3. **GIF Animation Enhancement** - Applies gaming effects to uploaded GIF animations with frame synchronization

## Common Development Tasks

### Running the Application
```bash
# No build process needed - just serve the files
# Option 1: Python simple server
python3 -m http.server 8000

# Option 2: Node.js http-server (if installed)
npx http-server

# Then open http://localhost:8000 in browser
```

### Testing Changes
- Simply refresh the browser after editing files
- Check browser console for any JavaScript errors
- Test in both light and dark modes
- Verify animations work correctly

## Important Technical Details

### Canvas Rendering
- All graphics are rendered using HTML5 Canvas API
- Animation loops use `requestAnimationFrame`
- Double buffering prevents flicker during animations

### GIF Generation
- Uses Web Workers for non-blocking GIF creation
- Automatic frame count calculation based on animation speed
- Memory-efficient frame generation

### Browser Compatibility
- Requires modern browser with Canvas, File API, and Web Workers support
- CSS uses modern features like CSS Grid and custom properties
- Dark mode preference stored in localStorage

### Performance Considerations
- All processing is client-side - be mindful of memory usage
- Large canvas sizes or many animation frames can impact performance
- GIF generation is CPU-intensive and runs in a worker thread

## Code Style Guidelines

- Use ES6+ JavaScript features
- Maintain existing naming conventions (camelCase for functions/variables)
- Keep UI text in Japanese as per current implementation
- Preserve the single-file architecture (no module splitting)

## Development Workflow

### Making Changes
1. Test changes by serving files locally and refreshing browser
2. Verify functionality in both light and dark modes
3. Check browser console for JavaScript errors
4. Test animations and visual effects work correctly
5. NEVER commit or push changes to remote repository

### Debugging
- Use browser DevTools Console for JavaScript debugging
- Check Network tab for resource loading issues
- Inspect Canvas rendering using canvas inspection tools
- Monitor performance using browser Performance tab

## File Structure Notes

The application uses a class-based architecture:
- `ConcentrationLineGenerator` - Handles the concentration lines feature
- `GamingTextGenerator` - Handles the gaming text/stamp feature
- `GIFFrameExtractor` - Utility for extracting frames from uploaded GIFs
- Global functions for tab switching and dark mode toggle

Canvas elements are the primary rendering targets with requestAnimationFrame for smooth animations.
# CandelightCompanion

Candlelight Companion is a Chrome extension that provides a lightweight “desktop companion” experience in the browser. It displays a pixel-art animated companion within a simple scene and will expand into a gamified productivity and focus tool over time.

This is an early prototype focused on rendering and structure, not final visuals or features.

## Design Goals

- Pixel-art based aesthetic with crisp scaling
- Simple, readable companion animation system
- Modular architecture for future gamification features
- Lightweight Chrome extension performance
- Avoid over-engineering early UI complexity

## Technical Overview

### Resolution System
- Base scene resolution: 320px × 600px
- Assets are designed for pixel art scaling
- Intended scaling approach: integer scaling/CSS pixelated rendering

### Rendering Approach (current)
- Static scene container (HTML/CSS)
- Image-based assets (pixel art sprites/backgrounds)
- Basic interaction hooks (e.g. click-triggered animation placeholders)

## Planned Features

### Companion System
- Animated character with idle and reactive states
- Contextual animations (focus, idle, celebration, etc.)
- Emotion/state system tied to user actions

### Productivity Layer
- Pomodoro timer
- Task tracking
- Focus sessions tied to companion state changes

### Gamification
- Companion growth or progression system
- Rewards for completed focus sessions
- Cosmetic unlocks for scene and character

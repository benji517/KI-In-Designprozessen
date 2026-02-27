```markdown
# 🐱 Circle of Cats

An immersive WebVR gallery experience featuring five interactive cat sculptures. Walk through a minimalist, atmospheric space where each cat responds to your presence with light, sound, and gentle animations.

Built with A-Frame and Three.js.

---

## ✨ Features

- **🎨 5 Unique Cat Models** - Each with distinct GLB models and custom spotlight illumination
- **🎮 First-Person Navigation** - WASD movement with mouse-look controls
- **💡 Interactive Glow Effects** - Pet cats to trigger 5-second emissive glow animations
- **🔊 Spatial Audio** - Individual sound effects for each cat + ambient background music
- **📍 Proximity Detection** - Dynamic UI hints when approaching interactive zones
- **🌫️ Atmospheric Lighting** - Fog, spotlights, and carefully balanced ambient lighting
- **📱 VR-Ready** - Built on A-Frame for WebXR compatibility

---

## 🎮 Controls

| Input | Action |
|-------|--------|
| **W/A/S/D** | Move forward/left/backward/right |
| **Mouse** | Look around |
| **E** | Interact with cat (when nearby) |
| **Click** | Interact with cat (when nearby) |

---

## 📁 Project Structure

### **`index.html`**
Main scene file containing:
- Asset preloading (models + sounds)
- 5 cat stations with pedestals and spotlights
- Camera rig with background music
- Scene loading and audio management logic

### **`js/interactions.js`**
Custom A-Frame components:
- `cat-model` - GLB model loader with fallback boxes
- `proximity-zone` - Detects player proximity and shows interaction hints
- `interaction-controller` - Handles E key and click inputs
- `cat-glow` - Emissive glow effect on interaction
- `cat-sound` - Plays spatial audio with configurable volume

### **`assets/models/`**
Five GLB models exported from Spline:
- `cat_01.glb` through `cat_05.glb`

### **`assets/sounds/`**
Audio files:
- `cat_01_sound.wav` through `cat_05_sound.wav` - Individual cat sounds
- `background_sound.wav` - 2-minute looping ambient track

---

## 🙏 Credits

- **Models** - Created in [Spline](https://spline.design)
- **Framework** - [A-Frame](https://aframe.io) by Mozilla
- **3D Engine** - [Three.js](https://threejs.org)
- **Sound Design** - [ElevenLabs](https://elevenlabs.io/app/home)

---

**Built with ❤️ for interactive web experiences**
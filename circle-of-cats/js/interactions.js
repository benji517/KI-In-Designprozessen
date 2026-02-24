// ============================================
// CIRCLE OF CATS - INTERACTION SYSTEM v4 MVP
// With GLB Models + Sound Support + Softer Glow
// ============================================

// ============================================
// 0. CAT MODEL LOADER COMPONENT
// Loads GLB model with fallback to colored box
// ============================================
AFRAME.registerComponent('cat-model', {
  schema: {
    modelId: { type: 'selector', default: null },
    fallbackColor: { type: 'color', default: '#ffffff' }
  },

  init: function() {
    if (!this.data.modelId) {
      this.createFallback();
      return;
    }

    const modelSrc = this.data.modelId.getAttribute('src');

    // Try to load the GLB model
    this.data.modelId.addEventListener('loaded', () => {
      console.log('✅ Model loaded:', modelSrc);
      this.loadModel();
    });

    this.data.modelId.addEventListener('error', () => {
      console.warn('⚠️ Model failed, using fallback:', modelSrc);
      this.createFallback();
    });

    // If model is already loaded
    if (this.data.modelId.hasLoaded) {
      this.loadModel();
    }
  },

  loadModel: function() {
    // Add the GLB model to this entity
    this.el.setAttribute('gltf-model', `#${this.data.modelId.id}`);
  },

  createFallback: function() {
    // Create colored box as fallback
    console.log('📦 Using fallback box for:', this.el.id);
    this.el.setAttribute('geometry', {
      primitive: 'box',
      width: 0.6,
      height: 0.7,
      depth: 0.5
    });
    this.el.setAttribute('material', {
      color: this.data.fallbackColor,
      roughness: 0.7,
      metalness: 0
    });
  }
});

// ============================================
// 1. PROXIMITY ZONE COMPONENT
// Detects when player is near a cat
// ============================================
AFRAME.registerComponent('proximity-zone', {
  schema: {
    catId: { type: 'string', default: '' },
    radius: { type: 'number', default: 1.8 }
  },

  init: function() {
    this.camera = null;
    this.isInZone = false;
    this.checkInterval = null;
    this.hint = document.getElementById('hint');

    this.el.sceneEl.addEventListener('loaded', () => {
      this.camera = document.getElementById('player-camera');
      if (this.camera) {
        this.startChecking();
      }
    });
  },

  startChecking: function() {
    this.checkInterval = setInterval(() => {
      this.checkProximity();
    }, 100);
  },

  checkProximity: function() {
    if (!this.camera) return;

    const cameraPos = this.camera.object3D.getWorldPosition(new THREE.Vector3());
    const zonePos = this.el.object3D.getWorldPosition(new THREE.Vector3());
    const distance = cameraPos.distanceTo(zonePos);

    if (distance < this.data.radius && !this.isInZone) {
      this.isInZone = true;
      this.onEnterZone();
    } else if (distance >= this.data.radius && this.isInZone) {
      this.isInZone = false;
      this.onLeaveZone();
    }
  },

  onEnterZone: function() {
    console.log('🐱 Entered zone:', this.data.catId);

    if (this.hint) {
      this.hint.classList.add('visible');
    }

    const controller = this.camera.components['interaction-controller'];
    if (controller) {
      controller.setActiveZone(this.data.catId);
    }
  },

  onLeaveZone: function() {
    console.log('👋 Left zone:', this.data.catId);

    if (this.hint) {
      this.hint.classList.remove('visible');
    }

    const controller = this.camera.components['interaction-controller'];
    if (controller) {
      controller.clearActiveZone();
    }
  },

  remove: function() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
});

// ============================================
// 2. INTERACTION CONTROLLER
// Handles E key and click inputs
// ============================================
AFRAME.registerComponent('interaction-controller', {
  init: function() {
    this.activeCatId = null;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onClick = this.onClick.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('click', this.onClick);

    console.log('🎮 Interaction controller ready');
  },

  setActiveZone: function(catId) {
    this.activeCatId = catId;
  },

  clearActiveZone: function() {
    this.activeCatId = null;
  },

  onKeyDown: function(event) {
    if (event.key === 'e' || event.key === 'E') {
      this.triggerInteraction();
    }
  },

  onClick: function(event) {
    if (document.pointerLockElement) {
      this.triggerInteraction();
    }
  },

  triggerInteraction: function() {
    if (!this.activeCatId) return;

    console.log('✨ Petting cat:', this.activeCatId);

    const catEl = document.getElementById(this.activeCatId);
    if (catEl) {
      catEl.emit('pet');
    }
  },

  remove: function() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('click', this.onClick);
  }
});

// ============================================
// 3. CAT GLOW COMPONENT (SOFTER VERSION)
// Makes cat light up gently for 5 seconds
// Model details remain visible
// ============================================
AFRAME.registerComponent('cat-glow', {
  schema: {
    originalColor: { type: 'color', default: '#ffffff' },
    glowDuration: { type: 'number', default: 5000 }
  },

  init: function() {
    this.isGlowing = false;
    this.glowLight = null;

    this.el.addEventListener('pet', () => {
      if (!this.isGlowing) {
        this.activateGlow();
      }
    });
  },

  activateGlow: function() {
    if (this.isGlowing) return;

    this.isGlowing = true;
    console.log('💡 Cat glowing (subtle):', this.el.id);

    // Apply subtle emissive glow to all materials
    this.applyGlowToModel();

    // Add softer temporary point light
    this.glowLight = document.createElement('a-light');
    this.glowLight.setAttribute('type', 'point');
    this.glowLight.setAttribute('intensity', 1.5); // Reduced from 3 to 1.5
    this.glowLight.setAttribute('distance', 3);
    this.glowLight.setAttribute('color', this.data.originalColor);
    this.glowLight.setAttribute('position', '0 0.5 0');
    this.el.appendChild(this.glowLight);

    // Restore after 5 seconds
    setTimeout(() => {
      this.deactivateGlow();
    }, this.data.glowDuration);
  },

  applyGlowToModel: function() {
    const mesh = this.el.object3D;

    // Traverse all meshes in the model
    mesh.traverse((node) => {
      if (node.isMesh && node.material) {
        // Store original emissive if not already stored
        if (!node.userData.originalEmissive) {
          node.userData.originalEmissive = node.material.emissive ? node.material.emissive.clone() : new THREE.Color(0x000000);
          node.userData.originalEmissiveIntensity = node.material.emissiveIntensity || 0;
        }

        // Apply SOFTER glow (reduced intensity)
        node.material.emissive = new THREE.Color(this.data.originalColor);
        node.material.emissiveIntensity = 0.6; // Reduced from 1.5 to 0.6
        node.material.needsUpdate = true;
      }
    });
  },

  deactivateGlow: function() {
    console.log('💤 Cat glow ended:', this.el.id);

    // Restore original materials
    const mesh = this.el.object3D;
    mesh.traverse((node) => {
      if (node.isMesh && node.material && node.userData.originalEmissive) {
        node.material.emissive = node.userData.originalEmissive;
        node.material.emissiveIntensity = node.userData.originalEmissiveIntensity;
        node.material.needsUpdate = true;
      }
    });

    // Remove temporary light
    if (this.glowLight) {
      this.glowLight.remove();
      this.glowLight = null;
    }

    this.isGlowing = false;
  }
});

// ============================================
// 4. CAT SOUND COMPONENT
// Plays sound when cat is petted (with custom volume)
// ============================================
AFRAME.registerComponent('cat-sound', {
  schema: {
    soundId: { type: 'selector', default: null },
    volume: { type: 'number', default: 0.5 } // Configurable per cat
  },

  init: function() {
    this.soundElement = null;

    // Get the audio element
    if (this.data.soundId) {
      this.soundElement = this.data.soundId;
      if (this.soundElement) {
        this.soundElement.volume = this.data.volume;
      }
    }

    // Listen for pet event
    this.el.addEventListener('pet', () => {
      this.playSound();
    });
  },

  playSound: function() {
    if (!this.soundElement) {
      console.warn('⚠️ No sound loaded for:', this.el.id);
      return;
    }

    // Reset and play sound
    try {
      this.soundElement.currentTime = 0;
      this.soundElement.play();
      console.log('🔊 Playing sound for:', this.el.id, '| Volume:', this.data.volume);
    } catch (error) {
      console.warn('⚠️ Sound playback failed:', error);
    }
  }
});

console.log('✅ Circle of Cats - Interaction System v4 MVP (Final) Loaded');
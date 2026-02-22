// ============================================
// CUSTOM A-FRAME COMPONENTS
// Circle of Cats - Interaction System (FIXED)
// ============================================

// ============================================
// 0. CAT MODEL LOADER (with fallback)
// Replaces placeholder boxes with GLB models when loaded
// ============================================
AFRAME.registerComponent('cat-model', {
  schema: {
    src: { type: 'selector', default: null }
  },

  init: function() {
    if (!this.data.src) return;

    // Try to load GLB model
    const modelSrc = this.data.src.getAttribute('src');
    
    // Check if asset loaded successfully
    this.data.src.addEventListener('loaded', () => {
      console.log('✅ Model loaded:', modelSrc);
      // Replace placeholder with actual model
      this.el.setAttribute('gltf-model', `#${this.data.src.id}`);
      this.el.removeAttribute('geometry');
      this.el.removeAttribute('material');
    });

    this.data.src.addEventListener('error', () => {
      console.warn('⚠️ Model failed, using placeholder:', modelSrc);
      // Keep the placeholder box visible
    });
  }
});

// ============================================
// 1. PROXIMITY ZONE COMPONENT
// Detects when user enters/leaves cat area
// ============================================
AFRAME.registerComponent('proximity-zone', {
  schema: {
    catId: { type: 'string', default: '' },
    radius: { type: 'number', default: 1.5 },
    stationNum: { type: 'string', default: '01' }
  },

  init: function() {
    this.camera = null;
    this.isInZone = false;
    this.checkInterval = null;

    // Wait for scene to load
    this.el.sceneEl.addEventListener('loaded', () => {
      this.camera = document.querySelector('[camera]');
      if (this.camera) {
        this.startChecking();
      }
    });
  },

  startChecking: function() {
    // Check proximity every 150ms (less intensive)
    this.checkInterval = setInterval(() => {
      this.checkProximity();
    }, 150);
  },

  checkProximity: function() {
    if (!this.camera) return;

    const cameraPos = this.camera.object3D.getWorldPosition(new THREE.Vector3());
    const zonePos = this.el.object3D.getWorldPosition(new THREE.Vector3());
    const distance = cameraPos.distanceTo(zonePos);

    if (distance < this.data.radius && !this.isInZone) {
      // ENTERED ZONE
      this.isInZone = true;
      this.onEnterZone();
    } else if (distance >= this.data.radius && this.isInZone) {
      // LEFT ZONE
      this.isInZone = false;
      this.onLeaveZone();
    }
  },

  onEnterZone: function() {
    console.log('🐱 Entered zone:', this.data.catId);

    // Show hint UI
    this.showHint();

    // Enable interaction
    const controller = this.camera.components['interaction-controller'];
    if (controller) {
      controller.setActiveZone(this.el, this.data.stationNum);
    }

    // Emit event
    this.el.emit('zone-entered', { catId: this.data.catId });
  },

  onLeaveZone: function() {
    console.log('👋 Left zone:', this.data.catId);

    // Hide hint UI
    this.hideHint();

    // Disable interaction
    const controller = this.camera.components['interaction-controller'];
    if (controller) {
      controller.clearActiveZone();
    }

    // Emit event
    this.el.emit('zone-left', { catId: this.data.catId });
  },

  showHint: function() {
    const hint = document.getElementById('hint-ui');
    if (!hint) return;

    const zonePos = this.el.object3D.getWorldPosition(new THREE.Vector3());
    hint.setAttribute('position', {
      x: zonePos.x,
      y: zonePos.y + 2.2,
      z: zonePos.z
    });
    hint.setAttribute('visible', true);

    // Make hint face camera
    if (this.camera) {
      const cameraPos = this.camera.object3D.position;
      hint.object3D.lookAt(cameraPos);
    }
  },

  hideHint: function() {
    const hint = document.getElementById('hint-ui');
    if (hint) {
      hint.setAttribute('visible', false);
    }
  },

  remove: function() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
});

// ============================================
// 2. INTERACTION CONTROLLER COMPONENT
// Handles click and E key input
// ============================================
AFRAME.registerComponent('interaction-controller', {
  init: function() {
    this.activeZone = null;
    this.activeStationNum = null;
    
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onClick = this.onClick.bind(this);

    // Listen for E key
    window.addEventListener('keydown', this.onKeyDown);

    // Listen for mouse click
    window.addEventListener('click', this.onClick);

    console.log('🎮 Interaction controller initialized');
  },

  setActiveZone: function(zone, stationNum) {
    this.activeZone = zone;
    this.activeStationNum = stationNum;
  },

  clearActiveZone: function() {
    this.activeZone = null;
    this.activeStationNum = null;
  },

  onKeyDown: function(event) {
    // E key pressed
    if (event.key === 'e' || event.key === 'E') {
      this.triggerInteraction();
    }
  },

  onClick: function(event) {
    // Trigger interaction on any click when in game mode
    this.triggerInteraction();
  },

  triggerInteraction: function() {
    if (!this.activeZone || !this.activeStationNum) return;

    const catId = this.activeZone.getAttribute('proximity-zone').catId;
    console.log('✨ Petting cat:', catId);

    // Trigger sparkle effect
    this.activateSparkles(this.activeStationNum);

    // Emit interaction event
    this.activeZone.emit('cat-petted', { catId: catId });
  },

  activateSparkles: function(stationNum) {
    const sparklesId = `sparkles-${stationNum}`;
    const sparklesEl = document.getElementById(sparklesId);

    if (sparklesEl) {
      sparklesEl.emit('sparkle-burst');
    } else {
      console.warn('Sparkles not found:', sparklesId);
    }
  },

  remove: function() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('click', this.onClick);
  }
});

// ============================================
// 3. SPARKLE EFFECT COMPONENT
// Controls particle burst animation
// ============================================
AFRAME.registerComponent('sparkle-effect', {
  init: function() {
    this.el.addEventListener('sparkle-burst', () => {
      this.triggerBurst();
    });
  },

  triggerBurst: function() {
    const particleSystem = this.el.components['particle-system'];

    if (particleSystem) {
      console.log('✨ Sparkle burst!');
      
      // Enable particle system
      this.el.setAttribute('particle-system', 'enabled', true);

      // Disable after 1 second
      setTimeout(() => {
        this.el.setAttribute('particle-system', 'enabled', false);
      }, 1000);
    } else {
      console.warn('Particle system not found');
    }
  }
});

console.log('✅ Circle of Cats - Interaction System Loaded');
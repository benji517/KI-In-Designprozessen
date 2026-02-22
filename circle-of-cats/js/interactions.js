// ============================================
// CUSTOM A-FRAME COMPONENTS
// Circle of Cats - Interaction System
// ============================================

// ============================================
// 1. PROXIMITY ZONE COMPONENT
// Detects when user enters/leaves cat area
// ============================================
AFRAME.registerComponent('proximity-zone', {
  schema: {
    catId: { type: 'string', default: '' },
    radius: { type: 'number', default: 1.4 }
  },

  init: function() {
    this.camera = null;
    this.isInZone = false;
    this.checkInterval = null;
    
    // Wait for scene to load
    this.el.sceneEl.addEventListener('loaded', () => {
      this.camera = document.querySelector('[camera]');
      this.startChecking();
    });
  },

  startChecking: function() {
    // Check proximity every 100ms
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
    console.log('Entered zone:', this.data.catId);
    
    // Show hint UI
    this.showHint();
    
    // Enable interaction
    this.camera.setAttribute('interaction-controller', 'activeZone', this.el);
    
    // Emit event
    this.el.emit('zone-entered', { catId: this.data.catId });
  },

  onLeaveZone: function() {
    console.log('Left zone:', this.data.catId);
    
    // Hide hint UI
    this.hideHint();
    
    // Disable interaction
    this.camera.setAttribute('interaction-controller', 'activeZone', null);
    
    // Emit event
    this.el.emit('zone-left', { catId: this.data.catId });
  },

  showHint: function() {
    const hint = document.getElementById('hint-ui');
    if (hint) {
      // Position hint above the pedestal
      const zonePos = this.el.object3D.getWorldPosition(new THREE.Vector3());
      hint.setAttribute('position', {
        x: zonePos.x,
        y: zonePos.y + 2,
        z: zonePos.z
      });
      hint.setAttribute('visible', true);
      
      // Make hint face camera
      hint.object3D.lookAt(this.camera.object3D.position);
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
  schema: {
    activeZone: { type: 'selector', default: null }
  },

  init: function() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onClick = this.onClick.bind(this);
    
    // Listen for E key
    window.addEventListener('keydown', this.onKeyDown);
    
    // Listen for mouse click
    window.addEventListener('click', this.onClick);
  },

  onKeyDown: function(event) {
    // E key pressed
    if (event.key === 'e' || event.key === 'E') {
      this.triggerInteraction();
    }
  },

  onClick: function(event) {
    // Only trigger if pointer is locked (user is in game mode)
    if (document.pointerLockElement) {
      this.triggerInteraction();
    }
  },

  triggerInteraction: function() {
    const activeZone = this.data.activeZone;
    
    if (activeZone) {
      const catId = activeZone.getAttribute('proximity-zone').catId;
      console.log('Petting cat:', catId);
      
      // Trigger sparkle effect
      this.activateSparkles(catId);
      
      // Emit interaction event
      activeZone.emit('cat-petted', { catId: catId });
    }
  },

  activateSparkles: function(catId) {
    // Extract cat number from ID (e.g., "cat-01" -> "01")
    const catNumber = catId.split('-')[1];
    const sparklesId = `sparkles-${catNumber}`;
    const sparklesEl = document.getElementById(sparklesId);
    
    if (sparklesEl) {
      // Trigger sparkle burst
      sparklesEl.emit('sparkle-burst');
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
      // Enable particle system
      particleSystem.el.setAttribute('particle-system', 'enabled', true);
      
      // Disable after 1 second
      setTimeout(() => {
        particleSystem.el.setAttribute('particle-system', 'enabled', false);
      }, 1000);
    }
  }
});

// ============================================
// 4. GRADIENT SKY SHADER (Optional Enhancement)
// Custom shader for smoother radial background
// ============================================
AFRAME.registerShader('gradient', {
  schema: {
    topColor: { type: 'color', default: '#1a1a2e', is: 'uniform' },
    bottomColor: { type: 'color', default: '#0a0a14', is: 'uniform' }
  },

  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), 0.8), 0.0)), 1.0);
    }
  `
});

console.log('✨ Circle of Cats - Interaction System Loaded');
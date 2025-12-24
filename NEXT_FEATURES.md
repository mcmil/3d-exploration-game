# 🚀 Next Features - Implementation Guide

Quick reference for implementing the next features in priority order.

---

## 🏃 PRIORITY 1: Player Movement System

### What We're Building
A character you can control with a virtual joystick on mobile.

### Files to Create

#### 1. `src/game/PlayerController.ts`
**Purpose**: Manage player character, physics, and movement

**Key Features**:
- Create player mesh (capsule or box)
- Add physics body with Havok
- Handle movement input from joystick
- Ground detection
- Jump functionality
- Collision with environment

**Pseudocode**:
```typescript
class PlayerController {
  - player mesh (capsule)
  - physics aggregate
  - movement speed
  - jump force

  create() {
    - Create capsule mesh at (0, 2, 0)
    - Add physics aggregate with gravity
    - Set up collision
  }

  move(direction: Vector3) {
    - Apply velocity based on direction
    - Rotate player to face movement direction
  }

  jump() {
    - Check if on ground
    - Apply upward impulse
  }

  update(deltaTime) {
    - Update position
    - Check ground state
  }
}
```

---

#### 2. `src/ui/VirtualJoystick.ts`
**Purpose**: On-screen joystick for mobile touch input

**Key Features**:
- Babylon.js GUI-based joystick
- Bottom-left position
- Touch tracking
- Return normalized direction vector (-1 to 1 on X and Z)

**Pseudocode**:
```typescript
class VirtualJoystick {
  - GUI container
  - Outer circle (bounds)
  - Inner circle (thumb)
  - Touch state

  create(advancedTexture: AdvancedDynamicTexture) {
    - Create outer circle (150px, bottom-left)
    - Create inner thumb (75px)
    - Attach pointer events
  }

  onPointerDown() {
    - Record touch position
    - Show joystick
  }

  onPointerMove() {
    - Calculate offset from center
    - Clamp to outer circle radius
    - Update thumb position
  }

  onPointerUp() {
    - Reset thumb to center
    - Clear direction
  }

  getDirection(): Vector2 {
    - Return normalized direction
    - X = left/right, Y = forward/back
  }
}
```

---

#### 3. `src/game/PhysicsManager.ts` (optional but recommended)
**Purpose**: Initialize and manage physics engine

**Key Features**:
- Set up Havok physics
- Configure gravity
- Provide helper methods

**Pseudocode**:
```typescript
class PhysicsManager {
  - physics plugin

  async initialize(scene: Scene) {
    - Import HavokPhysics
    - Initialize physics plugin
    - Set scene gravity (0, -9.8, 0)
    - Enable physics on scene
  }

  createBody(mesh, type, mass) {
    - Create physics aggregate
    - Set mass and friction
    - Return aggregate
  }
}
```

---

### Files to Modify

#### `src/game/SceneManager.ts`
**Changes**:
- Import PlayerController
- Create player in createScene()
- Update camera to follow player
- Pass player update to game loop

```typescript
// Add to class
private player: PlayerController | null = null;

// In createScene()
this.player = new PlayerController(this.scene);
await this.player.create();

// Change camera to FollowCamera
this.camera = new FollowCamera(
  'followCam',
  new Vector3(0, 5, -10),
  this.scene
);
this.camera.lockedTarget = this.player.getMesh();
```

---

#### `src/game/GameEngine.ts`
**Changes**:
- Initialize physics manager
- Create virtual joystick
- Pass joystick input to player each frame

```typescript
// Add to initialize()
await this.physicsManager.initialize();
this.joystick = new VirtualJoystick(advancedTexture);

// In render loop
const direction = this.joystick.getDirection();
if (direction.length() > 0) {
  this.sceneManager.player.move(direction);
}
```

---

#### `src/main.ts`
**Changes**:
- Create AdvancedDynamicTexture for UI
- Pass to game engine

```typescript
// After scene creation
const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');
```

---

### Dependencies to Add

```json
// package.json - add to dependencies
"@babylonjs/havok": "^1.3.0"
```

Or use Cannon.js (lighter):
```json
"cannon-es": "^0.20.0"
```

---

### Testing Checklist

After implementation:
- [ ] Player capsule visible in scene
- [ ] Player has physics (falls with gravity)
- [ ] Virtual joystick appears bottom-left
- [ ] Joystick thumb moves with touch
- [ ] Player moves when joystick is used
- [ ] Player rotates to face movement direction
- [ ] Camera follows player smoothly
- [ ] Player collides with ground and objects
- [ ] Jump works (if implemented)
- [ ] No console errors

---

## 🎨 PRIORITY 2: Enhanced Environment

### What We're Building
Make the world more interesting with varied terrain and objects.

### Quick Tasks
1. Add hills/terrain using ground from heightmap
2. Create simple building structures (boxes)
3. Add "trees" (cylinders with spheres on top)
4. Place collectible items (small rotating spheres)
5. Add particle effects on collectibles

### File to Create
`src/game/Environment.ts`

**Features**:
- Generate terrain from heightmap or noise
- Place buildings procedurally
- Spawn collectibles
- Create vegetation

---

## 🎯 PRIORITY 3: Interactions

### What We're Building
Player can interact with objects in the world.

### Quick Tasks
1. Raycast from player to detect nearby objects
2. Show UI hint when near interactable object
3. Add interact button (tap icon)
4. Pick up collectibles
5. Show collected items count

### Files to Create
- `src/game/InteractionSystem.ts`
- `src/ui/HUD.ts`
- `src/game/Inventory.ts`

---

## 💾 Quick Commands Reference

```bash
# Install dependencies after adding to package.json
npm install

# Build locally
npm run build

# Dev server (if testing locally)
npm run dev

# Commit and deploy
git add .
git commit -m "Add player movement system"
git push
```

---

## 🐛 Common Issues & Solutions

### Physics not working
- Make sure to `await` physics initialization
- Check Havok/Cannon is imported correctly
- Verify scene.enablePhysics() is called

### Joystick not visible
- Ensure AdvancedDynamicTexture is created
- Check z-index/layer order
- Verify joystick position (left/bottom)

### Player falling through ground
- Add physics to ground mesh
- Set ground as static body (mass = 0)
- Check collision masks

### Camera not following
- Verify FollowCamera.lockedTarget is set
- Check camera distance/height settings
- Ensure player mesh exists

---

## 📝 Code Snippets

### Basic Player Movement
```typescript
move(direction: Vector2, deltaTime: number) {
  const speed = 5.0;
  const movement = new Vector3(
    direction.x * speed * deltaTime,
    0,
    direction.y * speed * deltaTime
  );

  // Apply to physics body
  this.physicsBody.setLinearVelocity(movement);
}
```

### Camera Follow Setup
```typescript
const camera = new FollowCamera('cam', new Vector3(0, 5, -10), scene);
camera.radius = 10;
camera.heightOffset = 5;
camera.rotationOffset = 0;
camera.cameraAcceleration = 0.05;
camera.maxCameraSpeed = 10;
camera.lockedTarget = playerMesh;
```

### Virtual Joystick Button
```typescript
const outerCircle = new Ellipse();
outerCircle.width = '150px';
outerCircle.height = '150px';
outerCircle.color = 'white';
outerCircle.thickness = 4;
outerCircle.alpha = 0.5;
outerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
outerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
outerCircle.left = 50;
outerCircle.top = -50;
```

---

**Ready to build?** Start with Priority 1: Player Movement!

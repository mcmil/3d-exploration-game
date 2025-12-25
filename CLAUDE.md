# Claude Development Guide

This document provides context and guidance for continuing development on this 3D Polish Christmas mobile game.

## Project Overview

A Babylon.js-based 3D mobile browser game with Polish Christmas theming, featuring:
- Isometric 3D exploration gameplay
- 4 playable repair-themed mini-games
- Complete Polish localization
- Regional theming (Zachodniopomorskie/Nowogard)
- Procedurally generated audio system
- Mobile-first touch controls

**Target Platform**: Mobile browsers (iOS Safari, Chrome Android)
**Tech Stack**: TypeScript 5.6.3, Babylon.js 7.54.3, Vite 5.4.21

---

## Architecture

### Core Systems

#### 1. **Audio System** (`src/game/AudioManager.ts`)
- **CRITICAL**: Uses native Web Audio API, NOT Babylon.js Sound
- AudioContext created lazily on first user interaction (browser requirement)
- All sounds procedurally generated as AudioBuffers
- Play method creates new BufferSource + GainNode per playback
- No external audio files needed

**Key Decisions**:
- Switched from Babylon.js Sound due to initialization issues with procedural buffers
- Single shared AudioContext to avoid browser limits
- Event listeners on document for click/touch/key to trigger initialization

**Common Issues**:
- If sounds don't play: Check console for "AudioContext created" log on first interaction
- Browser autoplay policies require user gesture before audio works
- Each sound playback is independent (can overlap)

#### 2. **World Generation** (`src/game/WorldGenerator.ts`)
- Map size: 350x350 units (±175 from origin)
- Cross-roads at x=0 and z=0 (6 units wide)
- Houses avoid roads and spawn point (±8 units from roads, 15 units from origin)
- Lidl store randomly positioned with entrance facing player

**Collision Avoidance**:
```typescript
// Houses
- minDistanceFromRoad: 8 units (roadWidth/2 + 5)
- minDistanceFromSpawn: 15 units
- Max 20 attempts per grid position
- Global limit: 500 attempts

// Lidl
- minDistanceFromHouses: 25 units
- minDistanceFromCenter: 20 units
- Up to 200 attempts
```

#### 3. **Player Controller** (`src/game/PlayerController.ts`)
- World boundaries: ±175 units (matches map size)
- Collision detection: distance-based with object-specific radii
- Collision sounds throttled to 200ms max frequency
- Movement speed: 70 units/second
- Rotation speed: 0.7 (instant direction changes)

**Object Collision Radii**:
- Houses: 3.5 units
- Trees: 2.0 units
- Boulders: 1.8 units
- Power poles: 0.8 units
- Repair van: 2.5 units

#### 4. **Building System** (`src/models/HouseBuilder.ts`)
- Windows and doors randomized across 3 walls (front/left/right)
- 33% probability for each wall
- Windows: boxes (not planes) for visibility
- Window emissive: 0.25 (reduced from 0.8 to prevent glare)
- Graffiti: DynamicTexture with text rendering

**Polish Graffiti**:
- "POMORZANIN\nPANY" - red spray paint, right wall
- "PAPRYKARZ" - orange spray paint, left wall

---

## File Structure

### Key Files to Know

**Game Logic**:
- `src/game/GameEngine.ts` - Main game loop, system initialization
- `src/game/SceneManager.ts` - Scene setup, camera (beta: π/3, alpha: -π/4)
- `src/game/WorldGenerator.ts` - Procedural world generation
- `src/game/PlayerController.ts` - Movement, collision, boundaries

**Systems**:
- `src/game/AudioManager.ts` - Web Audio API sound system
- `src/game/InteractionSystem.ts` - House interaction detection
- `src/game/QuestManager.ts` - Quest assignment and tracking
- `src/game/HUD.ts` - Minimap, quest counter, UI (worldSize: 175)

**UI**:
- `src/ui/VirtualJoystick.ts` - Touch controls
- `index.html` - HTML button for interactions (bypasses joystick)

**Mini-Games**:
- `src/minigames/PowerLineGame.ts` - Connect power lines
- `src/minigames/SatelliteTVGame.ts` - Adjust satellite angle
- `src/minigames/DeviceRepairGame.ts` - Fix circuits
- `src/minigames/MemoryClearGame.ts` - Match pairs

**Models**:
- `src/models/HouseBuilder.ts` - House generation with randomization
- `src/models/TreeBuilder.ts` - Pine tree generation

---

## Important Constants

### Map & Camera
```typescript
// SceneManager.ts
mapSize: 350               // World generation size
defaultBeta: Math.PI / 3   // Camera vertical angle (60°)
defaultAlpha: -Math.PI / 4 // Camera horizontal angle (-45°)
defaultRadius: 30          // Camera distance from player

// PlayerController.ts
worldSize: 175             // Player movement boundary (±175)

// HUD.ts
worldSize: 175             // Minimap scaling boundary
```

### Collision & Physics
```typescript
// WorldGenerator.ts - House generation
roadWidth: 6
minDistanceFromRoad: 8     // roadWidth/2 + 5
minDistanceFromSpawn: 15

// PlayerController.ts
playerRadius: 0.6
moveSpeed: 70.0
collisionSoundThrottle: 200ms
```

### Audio
```typescript
// AudioManager.ts
sfxVolume: 0.5             // Default volume
collisionVolume: 0.3       // Collision-specific (30% of sfxVolume)
```

---

## Common Development Tasks

### Adding a New Sound Effect

1. Add to type definition:
```typescript
// AudioManager.ts
export type SoundEffect =
  | 'existing_sound'
  | 'new_sound_name';  // Add here
```

2. Create sound buffer in `initializeSounds()`:
```typescript
this.createYourSound('new_sound_name');
```

3. Implement creation method:
```typescript
private createYourSound(name: SoundEffect): void {
  if (!this.audioContext) return;

  const sampleRate = this.audioContext.sampleRate;
  const duration = 0.5; // seconds
  const length = sampleRate * duration;
  const buffer = this.audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Generate waveform
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 3);
  }

  this.buffers.set(name, buffer);
}
```

4. Play sound:
```typescript
this.audioManager.play('new_sound_name');
```

### Changing Map Size

When changing map dimensions, update **ALL THREE**:

```typescript
// 1. SceneManager.ts - World generation
worldGen.generateWorld({
  mapSize: NEW_SIZE,  // e.g., 400
  // ...
});

// 2. PlayerController.ts - Movement boundaries
private readonly worldSize: number = NEW_SIZE / 2;  // e.g., 200

// 3. HUD.ts - Minimap scaling
private readonly worldSize: number = NEW_SIZE / 2;  // e.g., 200
```

### Adding New Building/Object Type

1. Create builder in `src/models/` (follow `HouseBuilder.ts` pattern)
2. Add to `WorldGenerator.ts`:
   - Import builder
   - Add generation method
   - Call from `generateWorld()`
   - Add to collision detection in `PlayerController.checkCollision()`

3. Update collision radii in `PlayerController.ts`:
```typescript
if (mesh.name === 'yourNewObject') objectRadius = X.X;
```

### Modifying Camera Angle

```typescript
// SceneManager.ts
public readonly defaultBeta: number = Math.PI / 3;  // Vertical (lower = closer to ground)
public readonly defaultAlpha: number = -Math.PI / 4;  // Horizontal rotation
public readonly defaultRadius: number = 30;  // Distance from player
```

**Camera angles**:
- Beta closer to 0 = lower, more ground-level view
- Beta closer to π/2 = higher, more top-down view
- Alpha = rotation around player

---

## Known Issues & Gotchas

### Audio
- ❌ **DON'T** create AudioContext in constructor
- ✅ **DO** create on first user interaction
- ❌ **DON'T** use Babylon.js Sound with procedural buffers
- ✅ **DO** use Web Audio API directly

### Collision Detection
- Roads are at x=0 and z=0 with 6-unit width
- Houses need 8-unit minimum distance from roads
- Collision detection uses **parent mesh names only** (not children)
- Each object type has specific collision radius

### Minimap
- Scaling formula: `(position / worldSize) * (minimapSize * 0.4)`
- WorldSize must match PlayerController worldSize
- Player position updates every frame via HUD.update()

### Building Randomization
- Window/door placement uses `Math.random()` at creation time
- Not deterministic - rebuilding creates different layouts
- Graffiti also randomized per house

### Polish Text
- All UI text in Polish (see mini-game files for examples)
- DynamicTexture.drawText() used for in-world text (graffiti)
- Ensure proper UTF-8 encoding for Polish characters (ą, ć, ę, ł, ń, ó, ś, ź, ż)

---

## Testing Checklist

### Audio System
- [ ] Open browser console
- [ ] Click/tap anywhere in game
- [ ] Verify "🎵 AudioContext created, state: running"
- [ ] Verify "🎵 Audio system initialized with 7 sounds"
- [ ] Walk near house → hear bell chime
- [ ] Bump into object → hear collision sound
- [ ] Interact with house → hear success jingle
- [ ] Complete quest → hear completion fanfare
- [ ] Complete all quests → hear ho-ho-ho

### Map & Collision
- [ ] Player starts at (0, 0, 0)
- [ ] Can move to edges at approximately (±175, 0, ±175)
- [ ] Cannot walk through houses
- [ ] Houses don't spawn on roads at x=0 or z=0
- [ ] Houses don't spawn within 15 units of player spawn
- [ ] Lidl store entrance faces player

### UI & Controls
- [ ] Minimap shows all quest markers
- [ ] Minimap player dot moves with player
- [ ] Interaction button appears near houses
- [ ] Quest counter updates on completion
- [ ] Polish text renders correctly

### Mini-Games
- [ ] All 4 mini-game types launch successfully
- [ ] Instructions in Polish
- [ ] Timer counts down
- [ ] Success/failure messages work
- [ ] Returns to main game after completion

---

## Development Workflow

### Building
```bash
npm run build          # TypeScript + Vite build
npm run dev            # Development server with hot reload
```

### Git Workflow
```bash
# Current branch naming convention
claude/3d-mobile-game-plan-[sessionId]

# Commit message format
[Action] [Area]: [Description]

Examples:
- "Add Christmas-themed sound system for interactions"
- "Fix audio system initialization, add collision sounds"
- "Prevent houses from spawning on roads and player spawn"
```

### Branch Strategy
- Development branch: `claude/3d-mobile-game-plan-eaadJ`
- Always push before creating PR
- PR to main branch when feature-complete

---

## Performance Considerations

### Mobile Optimization
- Engine settings: `adaptToDeviceRatio: true`
- Scene optimizer enabled
- No physics engine (using simple collision detection)
- Particle system limited to 5000 particles (snow)

### Audio
- Sounds stored as buffers (not streaming)
- Each play creates new source node (garbage collected after)
- Total memory: ~7 sounds × ~0.5s average = minimal footprint

### Collision Detection
- Only checks parent meshes (not children)
- Distance-based (faster than mesh intersection)
- Skips ground, roads, decorative elements

---

## Polish Localization Reference

### UI Text (Polish)
- "Napraw" = Repair
- "Zakończ zadanie" = Complete task
- "Sukces!" = Success!
- "Porażka!" = Failure!
- "Misja ukończona" = Mission completed
- "Czas: " = Time:
- "Zadania: " = Tasks:

### Regional Elements
- **Nowogard** - City in Zachodniopomorskie region
- **Paprykarz Szczeciński** - Regional fish spread
- **Bosman** - Local beer brand
- **Lidl** - International supermarket chain (present in Poland)
- **"POMORZANIN PANY"** - Pomeranian dialect graffiti
- **"PAPRYKARZ"** - Reference to regional food

---

## Future Improvement Ideas

### Audio
- Add background music (Christmas carols)
- Add footstep sounds
- Add ambient wind/snow sounds
- Volume controls in settings menu

### Gameplay
- More quest types
- Difficulty progression
- Leaderboard/high scores
- Power-ups or collectibles
- Day/night cycle

### World
- More building variety
- Interior views
- NPC characters
- Vehicle traffic on roads
- Seasonal changes

### Mobile
- Haptic feedback on collisions
- Pinch-to-zoom camera
- Swipe gestures for camera rotation
- Offline mode with service worker

---

## Debugging Tips

### Audio Not Playing
1. Check console for AudioContext state logs
2. Verify user interaction happened (click/touch/key)
3. Check `this.muted` flag
4. Verify buffer exists in Map before playing
5. Look for Web Audio API errors in console

### Collision Issues
1. Log mesh names in checkCollision to verify parent detection
2. Check object positions vs player position
3. Verify collision radii are appropriate
4. Test with different object types

### Map/Minimap Mismatch
1. Verify all three worldSize constants match
2. Check minimap scaling formula
3. Log player position and minimap dot position
4. Ensure HUD.update() is called every frame

### House Spawning Problems
1. Check road width and buffer distances
2. Log failed spawn attempts
3. Verify grid spacing calculation
4. Check spawn point exclusion zone

---

## Contact & Resources

**Project Repository**: mcmil/3d-exploration-game
**Babylon.js Docs**: https://doc.babylonjs.com/
**Web Audio API**: https://developer.mozilla.org/en-US/Web_Audio_API
**TypeScript**: https://www.typescriptlang.org/docs/

---

**Last Updated**: 2025-12-25
**Session**: claude/3d-mobile-game-plan-eaadJ
**Version**: Audio system complete, full Polish localization, 4 mini-games

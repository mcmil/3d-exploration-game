# 🎄 Szczecin Christmas Utility Repair Game - Design Document

## 🎮 Game Concept

**Title**: "Święta w Szczecinie" (Christmas in Szczecin)
**Genre**: Time-based 3D action/puzzle game
**Platform**: Mobile browser (WebGL)
**Setting**: Zachodniopomorskie region, near Szczecin, Poland
**Theme**: Christmas Eve utility emergency response

---

## 📖 Story

It's Christmas Eve in a neighborhood near Szczecin, and a winter storm has caused multiple utility problems! As a utility repair technician, you must race against time to restore services to homes before Christmas dinner. Fix power lines, restore satellite TV (Cyfrowy Polsat), diagnose broken devices, and help clear overloaded phones. The more homes you help, the merrier the Christmas!

---

## 🎯 Game Objectives

**Primary Goal**: Complete as many repair tasks as possible within the time limit
**Secondary Goals**:
- Restore power to all homes
- Fix all Cyfrowy Polsat satellite connections
- Diagnose and repair devices
- Clear memory from overloaded devices

**Win Condition**: Help as many homes as possible
**Scoring**: Points per completed task, time bonuses for quick completion

---

## 🕹️ Gameplay Mechanics

### Core Loop
1. Player spawns at repair van
2. Quest markers appear on houses with problems
3. Player navigates to marked house
4. Player initiates repair challenge
5. Complete mini-game/quick action
6. Receive points and move to next task
7. Race against timer

### Movement
- **Virtual Joystick** (bottom-left): Move player character
- **Auto-run**: Player automatically moves when joystick pushed
- **Collision**: Can't walk through houses or trees
- **Snow trails**: Visual feedback of player path

### Challenge Types

#### 1. Power Line Repair
**Problem**: Downed power lines from snow/ice
**Gameplay**:
- Navigate to power pole
- Tap sequence to reconnect wires (3-5 taps in rhythm)
- Visual feedback: sparks, reconnection animation
**Time**: 5-10 seconds
**Points**: 100

#### 2. Satellite Dish Repair (Cyfrowy Polsat)
**Problem**: Dish misaligned or covered in snow
**Gameplay**:
- Navigate to house with dish
- Tap and hold to clear snow (3 seconds)
- Rotate dial to realign (swipe left/right)
- Signal strength indicator shows success
**Time**: 10-15 seconds
**Points**: 150

#### 3. Device Diagnostic (TV/Router)
**Problem**: Device malfunction
**Gameplay**:
- Enter house (transition to diagnostic screen)
- 3 buttons: "Reset", "Check Cables", "Restart"
- Random correct solution each time
- Trial and error with hints
**Time**: 10-20 seconds
**Points**: 200

#### 4. Memory Clearing
**Problem**: Phone/tablet too full
**Gameplay**:
- Rhythm tapping mini-game
- Icons appear on screen in sequence
- Tap in correct rhythm to delete files
- Speed increases as you progress
- Miss 3 and fail
**Time**: 15-20 seconds
**Points**: 250

### Progression
- First 2 minutes: Easy tasks, learn mechanics
- Minutes 2-5: Multiple tasks available, player chooses
- Minutes 5-10: Increased difficulty, faster rhythms
- Timer runs to 10 minutes total

---

## 🗺️ Environment Design

### Map Layout
- **Size**: 100x100 units
- **Houses**: 15-20 houses scattered across map
- **Trees**: 30-40 pine trees with snow
- **Roads**: Simple snow-covered paths
- **Power lines**: Visible poles and wires connecting houses
- **Starting point**: Repair van in center

### Visual Style
- **Color Palette**:
  - Snow: White (#FFFFFF)
  - Sky: Winter blue/gray (#B0C4DE)
  - Houses: Warm colors (red, yellow, orange roofs)
  - Trees: Dark green with white snow
  - Power lines: Dark brown/black
- **Lighting**: Soft ambient (overcast winter day)
- **Atmosphere**: Light snow particles (optional performance)

### Polish Elements
- Traditional Polish house architecture (slanted roofs)
- Cyfrowy Polsat satellite dishes on houses
- Polish street signs (optional)
- Christmas decorations on houses

---

## 🎨 Assets List

### 3D Models (Procedurally Generated)

#### Houses (3 variations)
1. **Small House**: Box (4x3x4) + Pyramid roof (red)
2. **Medium House**: Box (6x4x5) + Pyramid roof (orange)
3. **Large House**: Box (8x4x6) + Pyramid roof (yellow)
- All with windows (darker rectangles)
- Chimneys (small cylinders)
- Satellite dishes (cylinder + cone)

#### Environment
1. **Pine Trees**: Cylinder (trunk) + 3 cones stacked (branches)
2. **Power Poles**: Cylinder (tall, thin)
3. **Power Lines**: Simple line meshes between poles
4. **Ground**: Large plane with snow texture
5. **Roads**: Darker plane sections

#### Props
1. **Repair Van**: Box with wheels (starting position)
2. **Quest Markers**: Floating exclamation mark icons
3. **Satellite Dish**: Small dish on house roofs

### UI Elements
1. **Virtual Joystick**: Circle with thumb
2. **Timer Display**: Top-center countdown
3. **Score Display**: Top-right counter
4. **Task Counter**: "Tasks: 5/20"
5. **Challenge Overlay**: Full-screen mini-game UI
6. **Success/Fail Feedback**: Popup messages

### Particles (Optional)
1. Snow falling
2. Sparks from power line repair
3. Success stars/sparkles

---

## 🎵 Audio (Future)
- Background: Calm Christmas music
- SFX: Footsteps in snow, wire connecting, satellite beep, success chime
- Voice: "Świetnie!" (Great!), "Następne zadanie!" (Next task!)

---

## 📊 Technical Architecture

### New Files to Create

```
src/
├── game/
│   ├── PlayerController.ts       # Player movement & physics
│   ├── QuestManager.ts           # Quest system & markers
│   ├── ChallengeManager.ts       # Mini-game coordinator
│   ├── ScoreManager.ts           # Score & timer
│   ├── WorldGenerator.ts         # Generate houses, trees, map
│   └── PhysicsManager.ts         # Havok/Cannon physics
├── challenges/
│   ├── PowerLineChallenge.ts    # Power repair mini-game
│   ├── SatelliteChallenge.ts    # Satellite repair
│   ├── DiagnosticChallenge.ts   # Device diagnostic
│   └── MemoryChallenge.ts       # Rhythm tapping game
├── ui/
│   ├── VirtualJoystick.ts       # Movement control
│   ├── HUD.ts                   # Timer, score, tasks
│   ├── ChallengeUI.ts           # Mini-game overlays
│   └── QuestMarker.ts           # 3D markers above houses
└── models/
    ├── HouseBuilder.ts          # Procedural houses
    └── TreeBuilder.ts           # Procedural trees
```

### Modified Files
- `SceneManager.ts` - Winter theme, lighting
- `GameEngine.ts` - Integrate all systems
- `main.ts` - Game flow orchestration

---

## 🚀 Implementation Phases

### Phase 1: Foundation (2-3 hours)
- ✅ Winter environment (snow, sky)
- ✅ Player movement with joystick
- ✅ Basic house models (5-10 houses)
- ✅ Pine trees
- ✅ HUD with timer and score

### Phase 2: Quest System (1-2 hours)
- Quest markers on houses
- Navigation to objectives
- Quest types and assignment
- Task counter

### Phase 3: Challenges (3-4 hours)
- Power line repair mini-game
- Satellite repair mini-game
- Diagnostic mini-game
- Memory clearing rhythm game

### Phase 4: Polish (1-2 hours)
- Christmas decorations
- Polish UI text
- Success/fail animations
- Performance optimization

**Total Development Time**: 7-11 hours

---

## 🎯 Success Metrics

**MVP (Minimum Viable Product)**:
- Player can move around snowy map
- 10+ houses with quest markers
- At least 2 challenge types working
- Timer and scoring functional
- Playable on mobile

**Full Version**:
- All 4 challenge types
- 20 houses
- Particle effects
- Polish language UI
- Sound effects
- Leaderboard (localStorage)

---

## 🎄 Christmas Theme Elements

- Snow-covered roofs on houses
- Christmas lights on some houses (colored dots)
- Wreaths on doors (green circles)
- Star on tallest tree
- Footprints in snow
- Warm window glow (yellow light from windows)

---

**Ready to implement!** Starting with Phase 1: Winter environment and player movement.

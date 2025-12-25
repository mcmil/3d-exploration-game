# Next Phase Plan: Gameplay Implementation

## Current Status ✅
- ✅ 3D isometric world (200x200 units)
- ✅ Polish Christmas theme (Szczecin setting)
- ✅ Fast player movement with dual joysticks
- ✅ Collision detection (houses, trees, boulders, van, poles)
- ✅ Isometric overhead camera with snap-back
- ✅ World boundaries and obstacles
- ✅ 25 houses, 50+ trees, 30 boulders, repair van
- ✅ Mobile-optimized performance

## Phase 2: Core Gameplay Mechanics

### Priority 1: Interaction System
**Goal:** Allow player to interact with houses when nearby

**Tasks:**
1. Create `InteractionSystem.ts`
   - Detect when player is within interaction range of a house (< 4 units)
   - Show interaction indicator above nearby houses
   - Create interaction button/UI element for mobile

2. House interaction states:
   - `needs_repair` - Red indicator, needs attention
   - `in_progress` - Yellow indicator, player working
   - `completed` - Green indicator, task done
   - `normal` - No indicator, no issues

3. Visual feedback:
   - Floating icon above house when in range
   - UI button "Fix Problem" appears when near affected house
   - Glow effect or highlight on interactable houses

**Implementation Details:**
```typescript
class InteractionSystem {
  private checkNearbyHouses(): House[]
  private showInteractionUI(house: House): void
  private startInteraction(house: House): void
}
```

---

### Priority 2: Quest/Task System
**Goal:** Track which houses need repairs and what type

**Tasks:**
1. Create `QuestManager.ts`
   - Randomly assign 3-5 houses with problems at game start
   - Track active quests (house location + problem type)
   - Track completed quests
   - Generate new quests when old ones complete

2. Quest types (from GAME_DESIGN.md):
   - `power_outage` - Power lines need fixing
   - `satellite_tv` - Cyfrowy Polsat dish problems
   - `device_repair` - Broken electronics
   - `memory_clear` - Phone memory issues

3. Visual markers:
   - Create floating quest markers above houses with problems
   - Different colors for different problem types:
     * Red = Power outage
     * Blue = Satellite TV
     * Yellow = Device repair
     * Purple = Memory clear

**Implementation Details:**
```typescript
interface Quest {
  houseId: string;
  type: 'power_outage' | 'satellite_tv' | 'device_repair' | 'memory_clear';
  position: Vector3;
  completed: boolean;
}

class QuestManager {
  private activeQuests: Quest[]
  public assignRandomQuests(count: number): void
  public completeQuest(questId: string): void
  public getNearestQuest(playerPos: Vector3): Quest | null
}
```

---

### Priority 3: First Mini-Game - Power Line Repair
**Goal:** Implement one simple, playable mini-game

**Why Power Line First:**
- Simplest conceptually
- Visual feedback is straightforward
- Good for testing interaction flow

**Tasks:**
1. Create `PowerLineGame.ts`
   - Simple tapping mini-game
   - Show power line with 3-5 disconnected sections
   - Player taps/clicks sections in order
   - Timer: 10 seconds to complete
   - Success = quest complete, house lights turn on
   - Failure = can retry

2. UI elements:
   - Fullscreen overlay when mini-game starts
   - Visual power line with broken connections
   - Tap targets (large for mobile)
   - Progress indicator (X/5 connections fixed)
   - Timer countdown

3. Feedback:
   - Sound effect when connection fixed
   - Visual spark/light effect
   - Success animation (lights turn on)
   - Failure animation (sparks, try again)

**Implementation Details:**
```typescript
class PowerLineGame {
  private connections: Connection[] = []; // 5 connection points
  private currentIndex: number = 0;
  private timeRemaining: number = 10;

  public start(): void
  public handleTap(connectionId: number): void
  public checkComplete(): boolean
  private onSuccess(): void
  private onFailure(): void
}
```

---

### Priority 4: UI/HUD System
**Goal:** Display quest info and game state to player

**Tasks:**
1. Create `HUD.ts` (Heads-Up Display)
   - Top bar: Current objective text
   - Quest counter: "Tasks: 2/5 completed"
   - Timer (if timed mode)
   - Mini-map (optional, for later)

2. GUI elements using Babylon.js GUI:
   - AdvancedDynamicTexture for overlay
   - Text elements for quest info
   - Progress bars
   - Mobile-friendly sizing

3. Information display:
   - "Go to house with red marker"
   - "Press to fix power outage"
   - "3 more houses to help!"
   - "All tasks complete!"

**Implementation Details:**
```typescript
class HUD {
  private advancedTexture: AdvancedDynamicTexture;
  private objectiveText: TextBlock;
  private questCounter: TextBlock;

  public updateObjective(text: string): void
  public updateQuestCount(completed: number, total: number): void
  public showInteractionPrompt(text: string): void
  public hideInteractionPrompt(): void
}
```

---

## Implementation Order

### Week 1: Foundation
1. **Day 1-2:** Interaction System
   - Distance detection to houses
   - Interaction range indicator
   - Basic interaction trigger

2. **Day 3-4:** Quest System
   - Quest manager with random assignment
   - Quest markers above houses
   - Quest tracking and completion

3. **Day 5:** HUD
   - Basic objective text
   - Quest counter
   - Interaction prompts

### Week 2: First Gameplay Loop
1. **Day 1-3:** Power Line Mini-Game
   - Full mini-game implementation
   - UI for game screen
   - Success/failure states

2. **Day 4:** Integration
   - Connect all systems together
   - Quest → Interaction → Mini-game → Completion
   - Test full gameplay loop

3. **Day 5:** Polish
   - Visual feedback improvements
   - Sound effects (optional)
   - Bug fixes

---

## Success Criteria

### Minimum Viable Gameplay (MVP):
- ✅ Player can see which houses need help (quest markers)
- ✅ Player can walk to a house
- ✅ Player can interact with house when nearby
- ✅ Mini-game launches and is playable
- ✅ Completing mini-game marks quest as done
- ✅ 3-5 quests can be completed in sequence
- ✅ UI shows progress and objectives

### Definition of Done:
- Player can complete a full gameplay session (5 quests)
- All interactions feel responsive on mobile
- Visual feedback is clear and understandable
- No major bugs or blocking issues
- Game is fun/engaging for at least 2-3 minutes

---

## Future Phases (After Phase 2)

### Phase 3: More Mini-Games
- Satellite TV alignment game
- Device diagnostic puzzle
- Memory clearing tapping game

### Phase 4: Progression & Polish
- Scoring system
- Time limits/challenges
- Better animations
- Sound effects and music
- Victory/game over screens

### Phase 5: Advanced Features
- Multiple difficulty levels
- Combo/streak bonuses
- Special Christmas events
- Leaderboards (if online)

---

## Technical Architecture

```
src/
├── game/
│   ├── GameEngine.ts (existing)
│   ├── SceneManager.ts (existing)
│   ├── PlayerController.ts (existing)
│   ├── WorldGenerator.ts (existing)
│   ├── InteractionSystem.ts (NEW)
│   ├── QuestManager.ts (NEW)
│   └── HUD.ts (NEW)
├── minigames/
│   ├── PowerLineGame.ts (NEW)
│   ├── SatelliteTVGame.ts (future)
│   ├── DeviceRepairGame.ts (future)
│   └── MemoryClearGame.ts (future)
├── models/ (existing)
└── ui/ (existing)
```

---

## Risk Mitigation

**Risks:**
1. Mini-games might not be fun
   - Mitigation: Prototype quickly, test early, iterate

2. Performance issues with many UI elements
   - Mitigation: Use object pooling, optimize GUI

3. Touch controls might not work well in mini-games
   - Mitigation: Large touch targets, simple mechanics

4. Scope creep (trying to do too much)
   - Mitigation: Stick to MVP, one mini-game first

---

## Questions to Resolve

1. Should quests be randomly generated or pre-placed?
   - **Recommendation:** Random for replayability

2. Should there be a time limit for the overall game?
   - **Recommendation:** Optional, start without, add later

3. How many quests should be active at once?
   - **Recommendation:** 3-5 for manageable gameplay

4. Should completed quests respawn?
   - **Recommendation:** Not in MVP, add as "endless mode" later

---

## Ready to Start?

This plan provides:
- Clear priorities (Interaction → Quests → Mini-game → HUD)
- Specific implementation details
- Realistic timeline
- Success criteria
- Future roadmap

**Next immediate action:** Create InteractionSystem.ts and implement house proximity detection.

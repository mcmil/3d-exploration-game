import { Engine, Scene } from '@babylonjs/core';
import { SceneManager } from './SceneManager';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { InteractionSystem } from './InteractionSystem';
import { QuestManager } from './QuestManager';
import { AudioManager } from './AudioManager';
import { HUD } from './HUD';
import { PowerLineGame } from '../minigames/PowerLineGame';
import { SatelliteTVGame } from '../minigames/SatelliteTVGame';
import { DeviceRepairGame } from '../minigames/DeviceRepairGame';
import { MemoryClearGame } from '../minigames/MemoryClearGame';

export class GameEngine {
  private engine: Engine;
  private canvas: HTMLCanvasElement;
  private sceneManager: SceneManager | null = null;
  private joystick: VirtualJoystick | null = null;
  private audioManager: AudioManager | null = null;
  private interactionSystem: InteractionSystem | null = null;
  private questManager: QuestManager | null = null;
  private hud: HUD | null = null;
  private currentMiniGame: PowerLineGame | SatelliteTVGame | DeviceRepairGame | MemoryClearGame | null = null;
  private currentQuest: any = null; // Store current nearby quest
  private htmlButton: HTMLButtonElement; // HTML button outside canvas
  private gameStartTime: number = 0; // Track game start time
  private totalGameTime: number = 0; // Total elapsed time in seconds

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Get HTML button element
    this.htmlButton = document.getElementById('interactionButton') as HTMLButtonElement;

    // Create engine with mobile-optimized settings
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false, // Use WebGL2 if available
      powerPreference: 'high-performance', // Request high-performance GPU
      adaptToDeviceRatio: true, // Auto-scale for device pixel ratio
    });

    // Mobile-specific optimizations
    this.setupMobileOptimizations();
  }

  private setupMobileOptimizations(): void {
    // Disable right-click context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Handle window resize for responsive canvas
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.engine.resize(), 100);
    });

    // Optimize for mobile performance
    this.engine.enableOfflineSupport = false; // Disable manifest checking
    this.engine.doNotHandleContextLost = true; // Better mobile stability
  }

  public async initialize(): Promise<void> {
    // Create scene manager
    this.sceneManager = new SceneManager(this.engine);
    await this.sceneManager.createScene();

    // Create virtual joystick (uses Babylon.js built-in)
    this.joystick = new VirtualJoystick();

    // Create interaction system
    const player = this.sceneManager.getPlayer();
    const scene = this.sceneManager.getScene();
    if (player && scene) {
      // Initialize audio manager
      this.audioManager = new AudioManager(scene);
      console.log('🎵 Audio manager initialized!');

      // Give player access to audio manager for collision sounds
      player.setAudioManager(this.audioManager);

      this.interactionSystem = new InteractionSystem(scene, player, this.audioManager);
      console.log('🔧 Interaction system initialized!');

      // Create quest manager and assign random quests
      this.questManager = new QuestManager(scene, this.audioManager);
      this.questManager.assignRandomQuests(5); // 5 quests at game start

      // Create HUD
      this.hud = new HUD(scene);
      const progress = this.questManager.getProgress();
      this.hud.updateQuestCount(progress.completed, progress.total);

      // Add quests to minimap
      const allQuests = this.questManager.getAllQuests();
      for (const quest of allQuests) {
        const colorString = this.questManager.getQuestColorString(quest.type);
        this.hud.addQuestToMinimap(quest.id, quest.position, colorString);
      }

      // Set up HTML button click handler (bypasses joystick completely)
      this.htmlButton.addEventListener('click', () => {
        console.log('🎯 HTML Button clicked! Current quest:', this.currentQuest);
        if (this.currentQuest && this.questManager) {
          console.log('🎮 Starting mini-game for quest:', this.currentQuest.type);
          this.startMiniGame(this.currentQuest.type, this.currentQuest.id);
        } else {
          console.log('❌ No current quest available');
        }
      });
    }

    // Start game timer
    this.gameStartTime = Date.now();

    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.sceneManager) {
        // Update player movement based on movement joystick
        const player = this.sceneManager.getPlayer();
        if (player && this.joystick) {
          const direction = this.joystick.getDirection();
          player.move(direction);
        }

        // Update camera rotation based on camera joystick with snap-back
        const camera = this.sceneManager.getCamera();
        if (camera && this.joystick) {
          const cameraRotation = this.joystick.getCameraRotation();
          const deltaTime = this.engine.getDeltaTime() / 1000;
          const length = cameraRotation.length();

          if (length > 0.01) {
            // Camera joystick is being used - rotate camera
            camera.alpha += cameraRotation.x * deltaTime * 7;
            camera.beta -= cameraRotation.y * deltaTime * 7;
          } else {
            // Camera joystick released - snap back to default isometric view
            const snapSpeed = 3.0; // Speed of snap-back

            // Lerp alpha back to default
            const alphaDiff = this.sceneManager.defaultAlpha - camera.alpha;
            camera.alpha += alphaDiff * snapSpeed * deltaTime;

            // Lerp beta back to default
            const betaDiff = this.sceneManager.defaultBeta - camera.beta;
            camera.beta += betaDiff * snapSpeed * deltaTime;

            // Lerp radius back to default
            const radiusDiff = this.sceneManager.defaultRadius - camera.radius;
            camera.radius += radiusDiff * snapSpeed * deltaTime;
          }
        }

        // Update interaction system
        if (this.interactionSystem) {
          this.interactionSystem.update();

          // Check if player is near any quest and update HTML button
          if (this.questManager && player && !this.currentMiniGame) {
            const playerPos = player.getPosition();
            const nearestQuest = this.questManager.getNearestQuest(playerPos);

            // Show/hide HTML button based on proximity (7.0 units)
            if (nearestQuest && nearestQuest.distance < 7.0) {
              this.currentQuest = nearestQuest;
              this.htmlButton.classList.add('visible');

              // Update button text with quest type
              const questNames: { [key: string]: string } = {
                power_outage: 'NAPRAW PRĄD ⚡',
                satellite_tv: 'NAPRAW SATELITĘ 📡',
                device_repair: 'NAPRAW URZĄDZENIE 🔧',
                memory_clear: 'WYCZYŚĆ PAMIĘĆ 💾'
              };
              this.htmlButton.textContent = questNames[nearestQuest.type] || 'NAPRAW PROBLEM';
            } else {
              this.currentQuest = null;
              this.htmlButton.classList.remove('visible');
            }
          }
        }

        // Update HUD and minimap
        if (this.hud && player) {
          this.hud.update();
          this.hud.updateMinimapPlayerPosition(player.getPosition());

          // Update total game time
          this.totalGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        }

        this.sceneManager.update();
      }
    });

    console.log('🎮 Game engine initialized!');
  }

  /**
   * Start mini-game based on quest type
   */
  private startMiniGame(questType: string, questId: string): void {
    if (!this.questManager || !this.hud) return;

    console.log(`🎮 Starting mini-game for ${questType}`);

    // Hide HUD during mini-game
    this.hud.hideInteractionPrompt();
    this.htmlButton.classList.remove('visible');

    const scene = this.sceneManager!.getScene()!;

    if (questType === 'power_outage') {
      // Launch Power Line mini-game
      this.currentMiniGame = new PowerLineGame(scene);
      this.currentMiniGame.start(
        () => this.onMiniGameSuccess(questId),
        () => this.onMiniGameFailure()
      );
    } else if (questType === 'satellite_tv') {
      // Launch Satellite TV mini-game
      this.currentMiniGame = new SatelliteTVGame(scene);
      this.currentMiniGame.start(
        () => this.onMiniGameSuccess(questId),
        () => this.onMiniGameFailure()
      );
    } else if (questType === 'device_repair') {
      // Launch Device Repair mini-game
      this.currentMiniGame = new DeviceRepairGame(scene);
      this.currentMiniGame.start(
        () => this.onMiniGameSuccess(questId),
        () => this.onMiniGameFailure()
      );
    } else if (questType === 'memory_clear') {
      // Launch Memory Clear mini-game
      this.currentMiniGame = new MemoryClearGame(scene);
      this.currentMiniGame.start(
        () => this.onMiniGameSuccess(questId),
        () => this.onMiniGameFailure()
      );
    }
  }

  /**
   * Called when mini-game is completed successfully
   */
  private onMiniGameSuccess(questId: string): void {
    if (!this.questManager || !this.hud) return;

    console.log('✅ Mini-game success! Completing quest...');

    // Clean up mini-game
    if (this.currentMiniGame) {
      this.currentMiniGame.dispose();
      this.currentMiniGame = null;
    }

    // Complete the quest
    this.questManager.completeQuest(questId);

    // Remove quest from minimap
    this.hud.removeQuestFromMinimap(questId);

    // Update HUD
    const progress = this.questManager.getProgress();
    this.hud.updateQuestCount(progress.completed, progress.total);

    // Check if all quests completed
    if (this.questManager.allQuestsCompleted()) {
      this.hud.showCompletionMessage(this.totalGameTime);
    }
  }

  /**
   * Called when mini-game fails
   */
  private onMiniGameFailure(): void {
    console.log('❌ Mini-game failed! Quest remains active.');

    // Clean up mini-game
    if (this.currentMiniGame) {
      this.currentMiniGame.dispose();
      this.currentMiniGame = null;
    }

    // Quest remains active, player can try again
    console.log('🕹️  Red joystick (left) - movement, Green joystick (right) - camera (snaps back)');
  }

  public getScene(): Scene | null {
    return this.sceneManager?.getScene() || null;
  }

  public dispose(): void {
    this.currentMiniGame?.dispose();
    this.hud?.dispose();
    this.questManager?.dispose();
    this.interactionSystem?.dispose();
    this.sceneManager?.dispose();
    this.engine.dispose();
  }

  public getQuestManager(): QuestManager | null {
    return this.questManager;
  }

  public getHUD(): HUD | null {
    return this.hud;
  }
}

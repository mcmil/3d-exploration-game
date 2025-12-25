import { Engine, Scene } from '@babylonjs/core';
import { SceneManager } from './SceneManager';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { InteractionSystem } from './InteractionSystem';
import { QuestManager } from './QuestManager';
import { HUD } from './HUD';
import { PowerLineGame } from '../minigames/PowerLineGame';

export class GameEngine {
  private engine: Engine;
  private canvas: HTMLCanvasElement;
  private sceneManager: SceneManager | null = null;
  private joystick: VirtualJoystick | null = null;
  private interactionSystem: InteractionSystem | null = null;
  private questManager: QuestManager | null = null;
  private hud: HUD | null = null;
  private currentMiniGame: PowerLineGame | null = null;
  private currentQuest: any = null; // Store current nearby quest

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

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
      this.interactionSystem = new InteractionSystem(scene, player);
      console.log('🔧 Interaction system initialized!');

      // Create quest manager and assign random quests
      this.questManager = new QuestManager(scene);
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

      // Set up interaction button callback
      this.hud.onInteractionButtonClick(() => {
        console.log('🎯 Button clicked! Current quest:', this.currentQuest);
        if (this.currentQuest && this.questManager) {
          console.log('🎮 Starting mini-game for quest:', this.currentQuest.type);
          this.startMiniGame(this.currentQuest.type, this.currentQuest.id);
        } else {
          console.log('❌ No current quest available');
        }
      });

      // Add manual touch detection for button area (joystick bypass)
      this.canvas.addEventListener('touchstart', (event: TouchEvent) => {
        if (!this.currentQuest || !this.hud) return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        // Button is centered horizontally, 30px from bottom, 220px wide, 70px tall
        const buttonWidth = 220;
        const buttonHeight = 70;
        const buttonBottom = 30;
        const buttonCenterX = rect.width / 2;
        const buttonLeft = buttonCenterX - buttonWidth / 2;
        const buttonRight = buttonCenterX + buttonWidth / 2;
        const buttonTop = rect.height - buttonBottom - buttonHeight;
        const buttonBottomY = rect.height - buttonBottom;

        // Check if touch is within button bounds
        if (touchX >= buttonLeft && touchX <= buttonRight &&
            touchY >= buttonTop && touchY <= buttonBottomY) {
          console.log('🎯 Touch detected in button area!', { touchX, touchY, buttonLeft, buttonRight, buttonTop, buttonBottomY });
          event.preventDefault(); // Prevent joystick from capturing
          event.stopPropagation();

          if (this.questManager) {
            this.startMiniGame(this.currentQuest.type, this.currentQuest.id);
          }
        }
      }, { passive: false });
    }

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

          // Check if player is near any quest (bypassing house mesh matching)
          if (this.hud && this.questManager && player) {
            const playerPos = player.getPosition();
            const nearestQuest = this.questManager.getNearestQuest(playerPos);

            // Show prompt if within interaction range
            if (nearestQuest && nearestQuest.distance < 7.0) {
              this.hud.showInteractionPrompt(nearestQuest.type);

              // Store current quest for interaction button
              (this as any).currentQuest = nearestQuest;
            } else {
              this.hud.hideInteractionPrompt();
              (this as any).currentQuest = null;
            }
          }
        }

        // Update HUD and minimap
        if (this.hud && player) {
          this.hud.update();
          this.hud.updateMinimapPlayerPosition(player.getPosition());
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

    if (questType === 'power_outage') {
      // Launch Power Line mini-game
      this.currentMiniGame = new PowerLineGame(this.sceneManager!.getScene()!);
      this.currentMiniGame.start(
        () => this.onMiniGameSuccess(questId),
        () => this.onMiniGameFailure()
      );
    } else {
      // For other quest types, complete immediately (mini-games to be added later)
      console.log(`⚠️ No mini-game for ${questType} yet, completing automatically`);
      this.onMiniGameSuccess(questId);
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
      this.hud.showCompletionMessage();
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

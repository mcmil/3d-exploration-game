import { Engine, Scene } from '@babylonjs/core';
import { SceneManager } from './SceneManager';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { InteractionSystem } from './InteractionSystem';
import { QuestManager } from './QuestManager';
import { HUD } from './HUD';

export class GameEngine {
  private engine: Engine;
  private canvas: HTMLCanvasElement;
  private sceneManager: SceneManager | null = null;
  private joystick: VirtualJoystick | null = null;
  private interactionSystem: InteractionSystem | null = null;
  private questManager: QuestManager | null = null;
  private hud: HUD | null = null;

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

      // Set up interaction button callback
      this.hud.onInteractionButtonClick(() => {
        if (this.interactionSystem && this.questManager && this.hud) {
          const currentHouse = this.interactionSystem.getCurrentInteractable();
          if (currentHouse) {
            const quest = this.questManager.getQuestAtHouse(currentHouse.mesh);
            if (quest) {
              // Complete the quest
              this.questManager.completeQuest(quest.id);

              // Update HUD
              const progress = this.questManager.getProgress();
              this.hud.updateQuestCount(progress.completed, progress.total);
              this.hud.hideInteractionPrompt();

              // Check if all quests completed
              if (this.questManager.allQuestsCompleted()) {
                this.hud.showCompletionMessage();
              }
            }
          }
        }
      });
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

          // Update HUD based on interaction state
          if (this.hud && this.questManager) {
            const currentHouse = this.interactionSystem.getCurrentInteractable();
            if (currentHouse) {
              const quest = this.questManager.getQuestAtHouse(currentHouse.mesh);
              if (quest) {
                this.hud.showInteractionPrompt(quest.type);
              } else {
                this.hud.hideInteractionPrompt();
              }
            } else {
              this.hud.hideInteractionPrompt();
            }
          }
        }

        // Update HUD
        if (this.hud) {
          this.hud.update();
        }

        this.sceneManager.update();
      }
    });

    console.log('🎮 Game engine initialized!');
    console.log('🕹️  Red joystick (left) - movement, Green joystick (right) - camera (snaps back)');
  }

  public getScene(): Scene | null {
    return this.sceneManager?.getScene() || null;
  }

  public dispose(): void {
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

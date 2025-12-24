import { Engine, Scene } from '@babylonjs/core';
import { SceneManager } from './SceneManager';

export class GameEngine {
  private engine: Engine;
  private canvas: HTMLCanvasElement;
  private sceneManager: SceneManager | null = null;

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

    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.sceneManager) {
        this.sceneManager.update();
      }
    });

    console.log('🎮 Game engine initialized!');
  }

  public getScene(): Scene | null {
    return this.sceneManager?.getScene() || null;
  }

  public dispose(): void {
    this.sceneManager?.dispose();
    this.engine.dispose();
  }
}

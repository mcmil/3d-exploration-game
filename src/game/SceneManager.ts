import {
  Scene,
  Engine,
  ArcRotateCamera,
  FollowCamera,
  HemisphericLight,
  Vector3,
  Color3,
  Color4,
  SceneOptimizer,
  SceneOptimizerOptions,
  ParticleSystem,
  Texture,
} from '@babylonjs/core';
import { WorldGenerator } from './WorldGenerator';
import { PlayerController } from './PlayerController';

export class SceneManager {
  private scene: Scene;
  private camera: ArcRotateCamera | FollowCamera | null = null;
  private player: PlayerController | null = null;

  constructor(engine: Engine) {
    this.scene = new Scene(engine);
    this.setupScene();
  }

  private setupScene(): void {
    // Set clear color (dark winter evening sky)
    this.scene.clearColor = new Color4(0.2, 0.25, 0.35, 1.0);

    // Enable collision detection
    this.scene.collisionsEnabled = true;

    // Physics disabled for now - will add back with correct version later
    console.log('⚙️ Running without physics (will add later with correct version)');

    // Configure scene optimizer for automatic quality adjustment
    const options = SceneOptimizerOptions.ModerateDegradationAllowed();
    SceneOptimizer.OptimizeAsync(this.scene, options);
  }

  public async createScene(): Promise<void> {
    // Create lighting
    this.createLighting();

    // Create environment
    this.createEnvironment();

    // Create player
    await this.createPlayer();

    // Create camera (must be after player for follow camera)
    this.createCamera();

    console.log('✨ Scene created successfully!');
  }

  private async createPlayer(): Promise<void> {
    this.player = new PlayerController(this.scene);
    await this.player.create();
  }

  private createCamera(): void {
    if (!this.player || !this.player.getMesh()) {
      console.error('Cannot create camera: player not initialized');
      return;
    }

    // ArcRotateCamera for better mobile control
    const playerPos = this.player.getPosition();
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2, // Alpha (horizontal rotation) - behind player
      Math.PI / 3,  // Beta (vertical angle)
      12,           // Radius (distance from target)
      playerPos,    // Target the player position
      this.scene
    );

    // Mobile-friendly camera settings
    this.camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);

    // Touch gestures
    this.camera.pinchPrecision = 50;
    this.camera.panningSensibility = 1000;
    this.camera.angularSensibilityX = 1000;
    this.camera.angularSensibilityY = 1000;

    // Camera limits
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 25;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2.2;

    // Smooth movement
    this.camera.inertia = 0.8;
    this.camera.wheelPrecision = 20;

    // Update camera target to follow player
    this.camera.lockedTarget = this.player.getMesh();

    console.log('📷 ArcRotate camera created with touch controls');
  }

  private createLighting(): void {
    // Hemispheric light for winter day (cooler tones)
    const light = new HemisphericLight(
      'winterLight',
      new Vector3(0, 1, 0),
      this.scene
    );

    light.intensity = 1.2; // Brighter for snow reflection
    light.diffuse = new Color3(0.95, 0.95, 1.0); // Slightly blue-white
    light.specular = new Color3(0.7, 0.7, 0.8);
    light.groundColor = new Color3(0.4, 0.4, 0.5); // Cool ground reflection
  }

  private createEnvironment(): void {
    // Generate winter world with houses and trees
    const worldGen = new WorldGenerator(this.scene);

    worldGen.generateWorld({
      mapSize: 200,
      numHouses: 25,
      numTrees: 50,
      numPowerPoles: 16,
      numBoulders: 30,
    });

    console.log('🏠 Generated', worldGen.getHouses().length, 'houses');
    console.log('🌲 Generated', worldGen.getTrees().length, 'trees');

    // Add falling snow
    this.createFallingSnow();
  }

  private createFallingSnow(): void {
    const particleSystem = new ParticleSystem('snow', 5000, this.scene);

    // Create a simple circular texture programmatically
    const textureSize = 64;
    const texture = new Texture(null, this.scene);
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Draw white circle with sharper edges (less fuzzy)
      const gradient = ctx.createRadialGradient(
        textureSize / 2, textureSize / 2, 0,
        textureSize / 2, textureSize / 2, textureSize / 2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, textureSize, textureSize);

      texture.updateURL(canvas.toDataURL());
    }

    particleSystem.particleTexture = texture;

    // Emission area - large box above the map
    particleSystem.emitter = new Vector3(0, 50, 0);
    particleSystem.minEmitBox = new Vector3(-120, 0, -120);
    particleSystem.maxEmitBox = new Vector3(120, 0, 120);

    // Bright opaque white particles with slight glow
    particleSystem.color1 = new Color4(1, 1, 1, 1);
    particleSystem.color2 = new Color4(0.95, 0.98, 1, 1); // Slight blue tint
    particleSystem.colorDead = new Color4(1, 1, 1, 0.3);

    // Smaller, crisper snowflakes
    particleSystem.minSize = 0.8;
    particleSystem.maxSize = 1.5;

    particleSystem.minLifeTime = 18;
    particleSystem.maxLifeTime = 28;

    particleSystem.emitRate = 200; // More snow

    // Gentle falling with drift
    particleSystem.direction1 = new Vector3(-1, -3, -0.5);
    particleSystem.direction2 = new Vector3(1, -3, 0.5);

    particleSystem.gravity = new Vector3(0, -0.4, 0);

    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI * 0.3;

    particleSystem.minEmitPower = 0.4;
    particleSystem.maxEmitPower = 0.9;

    particleSystem.updateSpeed = 0.012;

    // Standard alpha blending
    particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;

    particleSystem.start();

    console.log('❄️ Snow particle system started with', particleSystem.getCapacity(), 'particles');
  }

  public update(): void {
    this.scene.render();
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getPlayer(): PlayerController | null {
    return this.player;
  }

  public dispose(): void {
    this.scene.dispose();
  }
}

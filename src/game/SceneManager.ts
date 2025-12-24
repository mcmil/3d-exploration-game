import {
  Scene,
  Engine,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Color3,
  Color4,
  SceneOptimizer,
  SceneOptimizerOptions,
} from '@babylonjs/core';
import { WorldGenerator } from './WorldGenerator';

export class SceneManager {
  private scene: Scene;
  private camera: ArcRotateCamera | null = null;

  constructor(engine: Engine) {
    this.scene = new Scene(engine);
    this.setupScene();
  }

  private setupScene(): void {
    // Set clear color (winter overcast sky)
    this.scene.clearColor = new Color4(0.7, 0.75, 0.8, 1.0);

    // Enable collision detection
    this.scene.collisionsEnabled = true;

    // Configure scene optimizer for automatic quality adjustment
    const options = SceneOptimizerOptions.ModerateDegradationAllowed();
    SceneOptimizer.OptimizeAsync(this.scene, options);
  }

  public async createScene(): Promise<void> {
    // Create camera
    this.createCamera();

    // Create lighting
    this.createLighting();

    // Create environment
    this.createEnvironment();

    console.log('✨ Scene created successfully!');
  }

  private createCamera(): void {
    // ArcRotateCamera for easy touch control (orbital camera)
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2, // Alpha (horizontal rotation)
      Math.PI / 3,  // Beta (vertical rotation)
      15,           // Radius (distance from target)
      new Vector3(0, 2, 0), // Target position
      this.scene
    );

    // Mobile-friendly camera settings
    this.camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);

    // Touch gestures
    this.camera.pinchPrecision = 50; // Pinch to zoom sensitivity
    this.camera.panningSensibility = 1000; // Pan sensitivity
    this.camera.angularSensibilityX = 1000; // Horizontal rotation sensitivity
    this.camera.angularSensibilityY = 1000; // Vertical rotation sensitivity

    // Camera limits
    this.camera.lowerRadiusLimit = 5;  // Minimum zoom
    this.camera.upperRadiusLimit = 30; // Maximum zoom
    this.camera.lowerBetaLimit = 0.1;  // Don't go below ground
    this.camera.upperBetaLimit = Math.PI / 2.2; // Don't flip over

    // Smooth camera movement
    this.camera.inertia = 0.8;
    this.camera.wheelPrecision = 20;

    // Enable collision for camera
    this.camera.checkCollisions = true;
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
      mapSize: 100,
      numHouses: 18,
      numTrees: 35,
      numPowerPoles: 12,
    });

    console.log('🏠 Generated', worldGen.getHouses().length, 'houses');
    console.log('🌲 Generated', worldGen.getTrees().length, 'trees');
  }

  public update(): void {
    this.scene.render();
  }

  public getScene(): Scene {
    return this.scene;
  }

  public dispose(): void {
    this.scene.dispose();
  }
}

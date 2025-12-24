import {
  Scene,
  Engine,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  SceneOptimizer,
  SceneOptimizerOptions,
} from '@babylonjs/core';

export class SceneManager {
  private scene: Scene;
  private camera: ArcRotateCamera | null = null;

  constructor(private engine: Engine) {
    this.scene = new Scene(engine);
    this.setupScene();
  }

  private setupScene(): void {
    // Set clear color (sky blue)
    this.scene.clearColor = new Color4(0.5, 0.8, 1.0, 1.0);

    // Enable collision detection
    this.scene.collisionsEnabled = true;

    // Mobile performance optimizations
    this.scene.autoClear = false; // Don't auto-clear buffers
    this.scene.autoClearDepthAndStencil = false;

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
    // Hemispheric light (ambient + directional, very mobile-friendly)
    const light = new HemisphericLight(
      'light',
      new Vector3(0, 1, 0),
      this.scene
    );

    light.intensity = 1.0;
    light.diffuse = new Color3(1, 1, 1);
    light.specular = new Color3(0.5, 0.5, 0.5);
    light.groundColor = new Color3(0.3, 0.3, 0.5);
  }

  private createEnvironment(): void {
    // Create ground
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 50, height: 50 },
      this.scene
    );

    const groundMaterial = new StandardMaterial('groundMat', this.scene);
    groundMaterial.diffuseColor = new Color3(0.4, 0.8, 0.4); // Green grass
    groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular
    ground.material = groundMaterial;
    ground.checkCollisions = true;

    // Create some colorful boxes to explore
    this.createBox(new Vector3(0, 1, 0), new Color3(1, 0.2, 0.2), 2); // Red
    this.createBox(new Vector3(5, 1, 5), new Color3(0.2, 1, 0.2), 2); // Green
    this.createBox(new Vector3(-5, 1, 5), new Color3(0.2, 0.2, 1), 2); // Blue
    this.createBox(new Vector3(5, 1, -5), new Color3(1, 1, 0.2), 2); // Yellow
    this.createBox(new Vector3(-5, 1, -5), new Color3(1, 0.2, 1), 2); // Magenta

    // Create a tall tower
    this.createBox(new Vector3(10, 2.5, 0), new Color3(0.8, 0.8, 0.8), 5, 1, 1);

    // Create some spheres
    this.createSphere(new Vector3(0, 1.5, 8), new Color3(1, 0.5, 0));
    this.createSphere(new Vector3(-8, 1.5, -8), new Color3(0.5, 0, 1));

    // Create a platform
    const platform = MeshBuilder.CreateBox(
      'platform',
      { width: 8, height: 0.5, depth: 8 },
      this.scene
    );
    platform.position = new Vector3(0, 3, -10);
    const platformMat = new StandardMaterial('platformMat', this.scene);
    platformMat.diffuseColor = new Color3(0.6, 0.4, 0.2);
    platform.material = platformMat;
    platform.checkCollisions = true;
  }

  private createBox(
    position: Vector3,
    color: Color3,
    height: number = 2,
    width: number = 2,
    depth: number = 2
  ): void {
    const box = MeshBuilder.CreateBox(
      'box',
      { width, height, depth },
      this.scene
    );
    box.position = position;

    const material = new StandardMaterial('boxMat', this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.2, 0.2, 0.2);
    box.material = material;
    box.checkCollisions = true;
  }

  private createSphere(position: Vector3, color: Color3): void {
    const sphere = MeshBuilder.CreateSphere(
      'sphere',
      { diameter: 2 },
      this.scene
    );
    sphere.position = position;

    const material = new StandardMaterial('sphereMat', this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.5, 0.5, 0.5);
    sphere.material = material;
    sphere.checkCollisions = true;

    // Animate sphere (float up and down)
    let time = 0;
    this.scene.registerBeforeRender(() => {
      time += 0.02;
      sphere.position.y = position.y + Math.sin(time) * 0.5;
    });
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

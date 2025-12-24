import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Vector2,
} from '@babylonjs/core';

export class PlayerController {
  private scene: Scene;
  private playerMesh: Mesh | null = null;
  private moveSpeed: number = 70.0; // Even faster for very responsive feel
  private rotationSpeed: number = 0.4; // Even faster rotation

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public async create(): Promise<void> {
    // Create player capsule
    this.playerMesh = MeshBuilder.CreateCapsule(
      'player',
      {
        radius: 0.5,
        height: 2,
      },
      this.scene
    );

    this.playerMesh.position = new Vector3(0, 1, -5);

    // Player material (bright orange for visibility)
    const playerMat = new StandardMaterial('playerMat', this.scene);
    playerMat.diffuseColor = new Color3(1, 0.5, 0);
    playerMat.emissiveColor = new Color3(0.3, 0.15, 0);
    this.playerMesh.material = playerMat;

    // Add directional indicators

    // Hat on top (cone pointing up)
    const hat = MeshBuilder.CreateCylinder(
      'hat',
      {
        diameterTop: 0,
        diameterBottom: 0.6,
        height: 0.4,
      },
      this.scene
    );
    hat.position.y = 1.2; // On top of capsule
    hat.parent = this.playerMesh;

    const hatMat = new StandardMaterial('hatMat', this.scene);
    hatMat.diffuseColor = new Color3(1, 0, 0); // Red hat
    hatMat.emissiveColor = new Color3(0.3, 0, 0);
    hat.material = hatMat;

    // White pom-pom on top of Santa hat
    const pompom = MeshBuilder.CreateSphere(
      'pompom',
      { diameter: 0.2 },
      this.scene
    );
    pompom.position.y = 1.4; // On top of hat
    pompom.parent = this.playerMesh;

    const pompomMat = new StandardMaterial('pompomMat', this.scene);
    pompomMat.diffuseColor = new Color3(1, 1, 1); // White
    pompomMat.emissiveColor = new Color3(0.5, 0.5, 0.5); // Glowing white
    pompom.material = pompomMat;

    // Eyes (two spheres) - positioned at the front
    const eyeMat = new StandardMaterial('eyeMat', this.scene);
    eyeMat.diffuseColor = new Color3(1, 1, 1); // White
    eyeMat.emissiveColor = new Color3(0.5, 0.5, 0.5);

    const leftEye = MeshBuilder.CreateSphere(
      'leftEye',
      { diameter: 0.15 },
      this.scene
    );
    leftEye.position.set(-0.15, 0.3, 0.45); // Left side, front
    leftEye.parent = this.playerMesh;
    leftEye.material = eyeMat;

    const rightEye = MeshBuilder.CreateSphere(
      'rightEye',
      { diameter: 0.15 },
      this.scene
    );
    rightEye.position.set(0.15, 0.3, 0.45); // Right side, front
    rightEye.parent = this.playerMesh;
    rightEye.material = eyeMat;

    // Pupils (smaller black spheres)
    const pupilMat = new StandardMaterial('pupilMat', this.scene);
    pupilMat.diffuseColor = new Color3(0, 0, 0);
    pupilMat.emissiveColor = new Color3(0, 0, 0);

    const leftPupil = MeshBuilder.CreateSphere(
      'leftPupil',
      { diameter: 0.08 },
      this.scene
    );
    leftPupil.position.set(-0.15, 0.3, 0.52); // In front of eye
    leftPupil.parent = this.playerMesh;
    leftPupil.material = pupilMat;

    const rightPupil = MeshBuilder.CreateSphere(
      'rightPupil',
      { diameter: 0.08 },
      this.scene
    );
    rightPupil.position.set(0.15, 0.3, 0.52); // In front of eye
    rightPupil.parent = this.playerMesh;
    rightPupil.material = pupilMat;

    console.log('🚶 Player created at spawn point with directional indicators');
  }

  public move(direction: Vector2): void {
    if (!this.playerMesh) return;

    const length = direction.length();
    if (length === 0) return;

    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

    // Absolute world movement for isometric view
    // Joystick X = world X (left/right)
    // Joystick Y = world Z (forward/back)
    const moveDirection = new Vector3(
      direction.x * this.moveSpeed,
      0,
      direction.y * this.moveSpeed
    );

    // Apply movement
    this.playerMesh.position.x += moveDirection.x * deltaTime;
    this.playerMesh.position.z += moveDirection.z * deltaTime;

    // Rotate player to face movement direction
    if (length > 0.1) {
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
      const currentRotation = this.playerMesh.rotation.y;

      // Smooth rotation
      let rotationDiff = targetRotation - currentRotation;

      // Normalize angle difference to -PI to PI
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

      this.playerMesh.rotation.y += rotationDiff * this.rotationSpeed;
    }
  }

  public getMesh(): Mesh | null {
    return this.playerMesh;
  }

  public getPosition(): Vector3 {
    return this.playerMesh?.position || Vector3.Zero();
  }
}

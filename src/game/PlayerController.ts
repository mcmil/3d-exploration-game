import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Vector2,
} from '@babylonjs/core';
import { AudioManager } from './AudioManager';

export class PlayerController {
  private scene: Scene;
  private audioManager: AudioManager | null = null;
  private playerMesh: Mesh | null = null;
  private moveSpeed: number = 70.0; // Even faster for very responsive feel
  private rotationSpeed: number = 0.7; // Much faster rotation for instant direction changes
  private readonly worldSize: number = 175; // World is 350x350, so ±175 from origin
  private readonly playerRadius: number = 0.6; // Collision radius
  private lastCollisionTime: number = 0; // Throttle collision sounds

  // Store eye components to prevent disposal
  private eyeMaterial: StandardMaterial | null = null;
  private pupilMaterial: StandardMaterial | null = null;
  private leftEye: Mesh | null = null;
  private rightEye: Mesh | null = null;
  private leftPupil: Mesh | null = null;
  private rightPupil: Mesh | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager;
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

    // Spawn player away from the repair van (van is at 0, 0, -5)
    this.playerMesh.position = new Vector3(5, 1, -5);

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

    // Eyes (two spheres) - positioned at the front - store as instance variables
    this.eyeMaterial = new StandardMaterial('eyeMat', this.scene);
    this.eyeMaterial.diffuseColor = new Color3(1, 1, 1); // White
    this.eyeMaterial.emissiveColor = new Color3(0.5, 0.5, 0.5);

    this.leftEye = MeshBuilder.CreateSphere(
      'leftEye',
      { diameter: 0.15 },
      this.scene
    );
    this.leftEye.position.set(-0.15, 0.3, 0.45); // Left side, front
    this.leftEye.parent = this.playerMesh;
    this.leftEye.material = this.eyeMaterial;

    this.rightEye = MeshBuilder.CreateSphere(
      'rightEye',
      { diameter: 0.15 },
      this.scene
    );
    this.rightEye.position.set(0.15, 0.3, 0.45); // Right side, front
    this.rightEye.parent = this.playerMesh;
    this.rightEye.material = this.eyeMaterial;

    // Pupils (smaller black spheres) - store as instance variables
    this.pupilMaterial = new StandardMaterial('pupilMat', this.scene);
    this.pupilMaterial.diffuseColor = new Color3(0, 0, 0);
    this.pupilMaterial.emissiveColor = new Color3(0, 0, 0);

    this.leftPupil = MeshBuilder.CreateSphere(
      'leftPupil',
      { diameter: 0.08 },
      this.scene
    );
    this.leftPupil.position.set(-0.15, 0.3, 0.52); // In front of eye
    this.leftPupil.parent = this.playerMesh;
    this.leftPupil.material = this.pupilMaterial;

    this.rightPupil = MeshBuilder.CreateSphere(
      'rightPupil',
      { diameter: 0.08 },
      this.scene
    );
    this.rightPupil.position.set(0.15, 0.3, 0.52); // In front of eye
    this.rightPupil.parent = this.playerMesh;
    this.rightPupil.material = this.pupilMaterial;

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

    // Calculate new position
    const newX = this.playerMesh.position.x + moveDirection.x * deltaTime;
    const newZ = this.playerMesh.position.z + moveDirection.z * deltaTime;

    // Check world boundaries
    const clampedX = Math.max(-this.worldSize + this.playerRadius,
                              Math.min(this.worldSize - this.playerRadius, newX));
    const clampedZ = Math.max(-this.worldSize + this.playerRadius,
                              Math.min(this.worldSize - this.playerRadius, newZ));

    // Check collision with objects (houses, trees, boulders)
    const testPosition = new Vector3(clampedX, this.playerMesh.position.y, clampedZ);
    const wouldCollide = this.checkCollision(testPosition);

    if (!wouldCollide) {
      // Apply movement if no collision
      this.playerMesh.position.x = clampedX;
      this.playerMesh.position.z = clampedZ;
    } else {
      // Play collision sound (throttled to avoid spam)
      const now = Date.now();
      if (this.audioManager && now - this.lastCollisionTime > 200) { // Max once per 200ms
        this.audioManager.play('collision');
        this.lastCollisionTime = now;
      }
    }

    // Rotate player to face movement direction (instant rotation)
    if (length > 0.1) {
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
      const currentRotation = this.playerMesh.rotation.y;

      // Smooth rotation with very fast speed
      let rotationDiff = targetRotation - currentRotation;

      // Normalize angle difference to -PI to PI (shortest path)
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

      this.playerMesh.rotation.y += rotationDiff * this.rotationSpeed;
    }
  }

  private checkCollision(position: Vector3): boolean {
    // Get all meshes in the scene
    const meshes = this.scene.meshes;

    for (const mesh of meshes) {
      // Skip player mesh and its children
      if (mesh === this.playerMesh || mesh.parent === this.playerMesh) {
        continue;
      }

      // Skip non-collidable meshes
      if (!mesh.position || mesh.name === 'ground' || mesh.name === 'snow' ||
          mesh.name.includes('road') || mesh.name.includes('snowCap')) {
        continue;
      }

      // Check parent meshes only (exact name matches for main collision objects)
      if (mesh.name === 'house' ||
          mesh.name === 'pineTree' ||
          mesh.name === 'boulder' ||
          mesh.name === 'powerPole' ||
          mesh.name === 'repairVan') {

        // Simple distance-based collision detection
        const dx = position.x - mesh.position.x;
        const dz = position.z - mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Collision radius based on object type (increased for better collision)
        let objectRadius = 3.5; // Default for houses (larger to prevent going through)

        if (mesh.name === 'pineTree') objectRadius = 2.0; // Trees have wider spread
        if (mesh.name === 'boulder') objectRadius = 1.8; // Boulders are medium-sized
        if (mesh.name === 'powerPole') objectRadius = 0.8; // Poles are thin
        if (mesh.name === 'repairVan') objectRadius = 2.5; // Van is fairly large

        if (distance < this.playerRadius + objectRadius) {
          return true; // Collision detected
        }
      }
    }

    return false; // No collision
  }

  public getMesh(): Mesh | null {
    return this.playerMesh;
  }

  public getPosition(): Vector3 {
    return this.playerMesh?.position || Vector3.Zero();
  }
}

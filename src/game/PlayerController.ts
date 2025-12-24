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
  private moveSpeed: number = 5.0;
  private rotationSpeed: number = 0.1;

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

    console.log('🚶 Player created at spawn point');
  }

  public move(direction: Vector2): void {
    if (!this.playerMesh) return;
    if (direction.length() === 0) return;

    // Calculate movement direction (relative to world, not camera)
    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
    const moveDirection = new Vector3(
      direction.x * this.moveSpeed,
      0,
      direction.y * this.moveSpeed
    );

    // Simple position-based movement
    this.playerMesh.position.x += moveDirection.x * deltaTime;
    this.playerMesh.position.z += moveDirection.z * deltaTime;

    // Rotate player to face movement direction
    if (moveDirection.length() > 0.1) {
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

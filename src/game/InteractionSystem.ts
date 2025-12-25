import { Scene, Mesh, Vector3, GlowLayer, Color3, MeshBuilder, StandardMaterial } from '@babylonjs/core';
import { PlayerController } from './PlayerController';
import { AudioManager } from './AudioManager';

export interface InteractableHouse {
  mesh: Mesh;
  position: Vector3;
  distance: number;
}

export class InteractionSystem {
  private scene: Scene;
  private player: PlayerController;
  private audioManager: AudioManager;
  private readonly interactionRange: number = 4.0; // Distance to interact
  private currentInteractable: InteractableHouse | null = null;
  private glowLayer: GlowLayer;
  private interactionIndicator: Mesh | null = null;

  constructor(scene: Scene, player: PlayerController, audioManager: AudioManager) {
    this.scene = scene;
    this.player = player;
    this.audioManager = audioManager;

    // Create glow layer for highlighting interactable houses
    this.glowLayer = new GlowLayer('glow', scene, {
      mainTextureFixedSize: 256,
      blurKernelSize: 64
    });
    this.glowLayer.intensity = 1.5;
  }

  /**
   * Update interaction system - call every frame
   * Finds nearest house within interaction range
   */
  public update(): void {
    const playerPos = this.player.getPosition();
    let nearestHouse: InteractableHouse | null = null;
    let nearestDistance = this.interactionRange;

    // Check all houses in the scene
    const houses = this.scene.meshes.filter(mesh => mesh.name === 'house' && mesh instanceof Mesh) as Mesh[];

    for (const house of houses) {
      const dx = playerPos.x - house.position.x;
      const dz = playerPos.z - house.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Check if within interaction range and closer than current nearest
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestHouse = {
          mesh: house,
          position: house.position.clone(),
          distance: distance
        };
      }
    }

    // Update current interactable
    const previousInteractable = this.currentInteractable;
    this.currentInteractable = nearestHouse;

    // Handle entering/leaving interaction range
    if (nearestHouse && !previousInteractable) {
      this.onEnterInteractionRange(nearestHouse);
    } else if (!nearestHouse && previousInteractable) {
      this.onLeaveInteractionRange(previousInteractable);
    }
  }

  /**
   * Get the current house player can interact with
   */
  public getCurrentInteractable(): InteractableHouse | null {
    return this.currentInteractable;
  }

  /**
   * Check if player can currently interact with something
   */
  public canInteract(): boolean {
    return this.currentInteractable !== null;
  }

  /**
   * Attempt to interact with current house
   * Returns true if interaction was triggered
   */
  public interact(): boolean {
    if (!this.currentInteractable) {
      return false;
    }

    console.log('🔧 Interacting with house at:', this.currentInteractable.position);

    // Play interaction success sound
    this.audioManager.play('interaction_success');

    // This will be connected to mini-games later
    return true;
  }

  /**
   * Called when player enters interaction range
   */
  private onEnterInteractionRange(house: InteractableHouse): void {
    console.log('✨ Entered interaction range of house at:', house.position);

    // Play bell chime sound
    this.audioManager.play('interaction_enter');

    // Add glow effect to house
    this.glowLayer.addIncludedOnlyMesh(house.mesh);
    this.glowLayer.customEmissiveColorSelector = (mesh, _subMesh, _material, result) => {
      if (mesh === house.mesh) {
        result.set(0.2, 1.0, 0.2, 1.0); // Green glow
      }
    };

    // Create floating indicator above house
    this.interactionIndicator = MeshBuilder.CreateSphere('indicator', {
      diameter: 0.8,
      segments: 8
    }, this.scene);

    const indicatorMat = new StandardMaterial('indicatorMat', this.scene);
    indicatorMat.emissiveColor = new Color3(0.2, 1.0, 0.2); // Bright green
    indicatorMat.disableLighting = true;
    this.interactionIndicator.material = indicatorMat;

    // Position above house
    this.interactionIndicator.position = new Vector3(
      house.position.x,
      house.position.y + 6.0, // Float above house
      house.position.z
    );

    // Animate indicator (bobbing motion)
    this.scene.registerBeforeRender(() => {
      if (this.interactionIndicator) {
        this.interactionIndicator.position.y = house.position.y + 6.0 + Math.sin(Date.now() / 300) * 0.3;
      }
    });
  }

  /**
   * Called when player leaves interaction range
   */
  private onLeaveInteractionRange(house: InteractableHouse): void {
    console.log('👋 Left interaction range of house at:', house.position);

    // Play soft leave sound
    this.audioManager.play('interaction_leave');

    // Remove glow effect
    this.glowLayer.removeIncludedOnlyMesh(house.mesh);

    // Remove floating indicator
    if (this.interactionIndicator) {
      this.interactionIndicator.dispose();
      this.interactionIndicator = null;
    }
  }

  /**
   * Get interaction range for debugging/UI
   */
  public getInteractionRange(): number {
    return this.interactionRange;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.interactionIndicator) {
      this.interactionIndicator.dispose();
      this.interactionIndicator = null;
    }
    this.glowLayer.dispose();
  }
}

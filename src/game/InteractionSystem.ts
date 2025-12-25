import { Scene, Mesh, Vector3 } from '@babylonjs/core';
import { PlayerController } from './PlayerController';

export interface InteractableHouse {
  mesh: Mesh;
  position: Vector3;
  distance: number;
}

export class InteractionSystem {
  private scene: Scene;
  private player: PlayerController;
  private readonly interactionRange: number = 4.0; // Distance to interact
  private currentInteractable: InteractableHouse | null = null;

  constructor(scene: Scene, player: PlayerController) {
    this.scene = scene;
    this.player = player;
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
    // This will be connected to mini-games later
    return true;
  }

  /**
   * Called when player enters interaction range
   */
  private onEnterInteractionRange(house: InteractableHouse): void {
    console.log('✨ Entered interaction range of house at:', house.position);
    // Visual feedback will be added here later
  }

  /**
   * Called when player leaves interaction range
   */
  private onLeaveInteractionRange(house: InteractableHouse): void {
    console.log('👋 Left interaction range of house at:', house.position);
    // Remove visual feedback here later
  }

  /**
   * Get interaction range for debugging/UI
   */
  public getInteractionRange(): number {
    return this.interactionRange;
  }
}

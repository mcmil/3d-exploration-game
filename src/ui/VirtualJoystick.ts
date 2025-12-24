import {
  AdvancedDynamicTexture,
  Ellipse,
  Control,
} from '@babylonjs/gui';
import { Vector2, Scene, PointerEventTypes } from '@babylonjs/core';

export class VirtualJoystick {
  private outerCircle: Ellipse;
  private innerCircle: Ellipse;
  private direction: Vector2 = Vector2.Zero();
  private isActive: boolean = false;
  private scene: Scene;

  constructor(advancedTexture: AdvancedDynamicTexture, scene: Scene) {
    this.scene = scene;
    // Outer circle (joystick base) - LARGER and MORE VISIBLE
    this.outerCircle = new Ellipse();
    this.outerCircle.width = '200px'; // Increased from 150px
    this.outerCircle.height = '200px';
    this.outerCircle.color = 'white';
    this.outerCircle.thickness = 6; // Thicker border (was 4)
    this.outerCircle.alpha = 0.7; // More visible (was 0.4)
    this.outerCircle.background = 'rgba(255, 255, 255, 0.1)'; // Slight fill
    this.outerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.outerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.outerCircle.left = 100; // Adjusted for larger size
    this.outerCircle.top = -100;
    advancedTexture.addControl(this.outerCircle);

    // Inner circle (joystick thumb) - LARGER and MORE VISIBLE
    this.innerCircle = new Ellipse();
    this.innerCircle.width = '100px'; // Increased from 75px
    this.innerCircle.height = '100px';
    this.innerCircle.color = 'white';
    this.innerCircle.thickness = 6; // Thicker border (was 4)
    this.innerCircle.background = 'rgba(255, 255, 255, 0.5)'; // More visible (was 0.3)
    this.innerCircle.alpha = 0.9; // More visible (was 0.6)
    this.innerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.innerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.innerCircle.left = 100; // Adjusted for larger size
    this.innerCircle.top = -100;
    advancedTexture.addControl(this.innerCircle);

    this.setupPointerEvents();
  }

  private setupPointerEvents(): void {
    // Use scene-level pointer observables for better mobile support
    this.scene.onPointerObservable.add((pointerInfo) => {
      const pointerX = pointerInfo.event.clientX;
      const pointerY = pointerInfo.event.clientY;

      // Joystick center is at 100px from left, 100px from bottom (updated)
      const screenCenterX = 100;
      const screenCenterY = window.innerHeight - 100;

      const distanceFromCenter = Math.sqrt(
        Math.pow(pointerX - screenCenterX, 2) +
        Math.pow(pointerY - screenCenterY, 2)
      );

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          // Only activate if touching in joystick area (within 120px of center)
          if (distanceFromCenter < 120) {
            this.isActive = true;
          }
          break;

        case PointerEventTypes.POINTERMOVE:
          if (!this.isActive) return;

          // Calculate offset from center
          const deltaX = pointerX - screenCenterX;
          const deltaY = pointerY - screenCenterY;

          // Clamp to max distance (increased to 75 for larger joystick)
          const maxDist = 75;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          let thumbDeltaX = deltaX;
          let thumbDeltaY = deltaY;

          if (distance > maxDist) {
            const angle = Math.atan2(deltaY, deltaX);
            thumbDeltaX = Math.cos(angle) * maxDist;
            thumbDeltaY = Math.sin(angle) * maxDist;
          }

          // Update thumb position
          this.innerCircle.left = 100 + thumbDeltaX;
          this.innerCircle.top = -(100 - thumbDeltaY);

          // Calculate normalized direction
          this.direction.x = thumbDeltaX / maxDist;
          this.direction.y = -thumbDeltaY / maxDist; // Invert Y for game coordinates

          // Clamp to -1, 1 range
          this.direction.x = Math.max(-1, Math.min(1, this.direction.x));
          this.direction.y = Math.max(-1, Math.min(1, this.direction.y));
          break;

        case PointerEventTypes.POINTERUP:
          if (!this.isActive) return;

          this.isActive = false;

          // Reset thumb to center
          this.innerCircle.left = 100;
          this.innerCircle.top = -100;

          // Clear direction
          this.direction = Vector2.Zero();
          break;
      }
    });

    console.log('🕹️  Joystick pointer events initialized');
  }

  public getDirection(): Vector2 {
    return this.direction.clone();
  }

  public isPressed(): boolean {
    return this.isActive;
  }
}

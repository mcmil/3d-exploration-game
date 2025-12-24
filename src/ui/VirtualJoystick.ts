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
    // Outer circle (joystick base) - Christmas red theme
    this.outerCircle = new Ellipse();
    this.outerCircle.widthInPixels = 280;
    this.outerCircle.heightInPixels = 280;
    this.outerCircle.color = '#FF0000'; // Christmas red
    this.outerCircle.thickness = 10; // Very thick border
    this.outerCircle.alpha = 0.95;
    this.outerCircle.background = 'rgba(255, 0, 0, 0.25)'; // Red tint
    this.outerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.outerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.outerCircle.leftInPixels = 140;
    this.outerCircle.topInPixels = -140;
    advancedTexture.addControl(this.outerCircle);

    // Inner circle (joystick thumb) - Christmas green theme
    this.innerCircle = new Ellipse();
    this.innerCircle.widthInPixels = 140;
    this.innerCircle.heightInPixels = 140;
    this.innerCircle.color = '#00FF00'; // Christmas green
    this.innerCircle.thickness = 10; // Very thick border
    this.innerCircle.background = 'rgba(0, 255, 0, 0.7)'; // Green fill
    this.innerCircle.alpha = 1.0;
    this.innerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.innerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.innerCircle.leftInPixels = 140;
    this.innerCircle.topInPixels = -140;
    advancedTexture.addControl(this.innerCircle);

    this.setupPointerEvents();
  }

  private setupPointerEvents(): void {
    // Use scene-level pointer observables for better mobile support
    this.scene.onPointerObservable.add((pointerInfo) => {
      const pointerX = pointerInfo.event.clientX;
      const pointerY = pointerInfo.event.clientY;

      // Joystick center is at 140px from left, 140px from bottom
      const screenCenterX = 140;
      const screenCenterY = window.innerHeight - 140;

      const distanceFromCenter = Math.sqrt(
        Math.pow(pointerX - screenCenterX, 2) +
        Math.pow(pointerY - screenCenterY, 2)
      );

      // Touch area matches outer circle radius exactly (280px diameter = 140px radius)
      const inJoystickArea = distanceFromCenter < 140;

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          // Only activate if touching within the outer circle
          if (inJoystickArea) {
            this.isActive = true;
            // Prevent camera from handling this event
            pointerInfo.event.preventDefault();
          }
          break;

        case PointerEventTypes.POINTERMOVE:
          if (!this.isActive) return;

          // Prevent camera from handling this event
          pointerInfo.event.preventDefault();

          // Calculate offset from center
          const deltaX = pointerX - screenCenterX;
          const deltaY = pointerY - screenCenterY;

          // Clamp to max distance (70px = half of inner circle can reach edge of outer)
          const maxDist = 70;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          let thumbDeltaX = deltaX;
          let thumbDeltaY = deltaY;

          if (distance > maxDist) {
            const angle = Math.atan2(deltaY, deltaX);
            thumbDeltaX = Math.cos(angle) * maxDist;
            thumbDeltaY = Math.sin(angle) * maxDist;
          }

          // Update thumb position using exact pixels
          this.innerCircle.leftInPixels = 140 + thumbDeltaX;
          this.innerCircle.topInPixels = -(140 - thumbDeltaY);

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

          // Prevent camera from handling this event
          pointerInfo.event.preventDefault();

          // Reset thumb to center using exact pixels
          this.innerCircle.leftInPixels = 140;
          this.innerCircle.topInPixels = -140;

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

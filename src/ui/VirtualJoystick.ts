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
  private centerX: number = 75;
  private centerY: number = 75; // Distance from bottom
  private maxDistance: number = 50;
  private scene: Scene;

  constructor(advancedTexture: AdvancedDynamicTexture, scene: Scene) {
    this.scene = scene;
    // Outer circle (joystick base)
    this.outerCircle = new Ellipse();
    this.outerCircle.width = '150px';
    this.outerCircle.height = '150px';
    this.outerCircle.color = 'white';
    this.outerCircle.thickness = 4;
    this.outerCircle.alpha = 0.4;
    this.outerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.outerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.outerCircle.left = 75;
    this.outerCircle.top = -75;
    advancedTexture.addControl(this.outerCircle);

    // Inner circle (joystick thumb)
    this.innerCircle = new Ellipse();
    this.innerCircle.width = '75px';
    this.innerCircle.height = '75px';
    this.innerCircle.color = 'white';
    this.innerCircle.thickness = 4;
    this.innerCircle.background = 'rgba(255, 255, 255, 0.3)';
    this.innerCircle.alpha = 0.6;
    this.innerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.innerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.innerCircle.left = 75;
    this.innerCircle.top = -75;
    advancedTexture.addControl(this.innerCircle);

    this.setupPointerEvents();
  }

  private setupPointerEvents(): void {
    // Use scene-level pointer observables for better mobile support
    this.scene.onPointerObservable.add((pointerInfo) => {
      const pointerX = pointerInfo.event.clientX;
      const pointerY = pointerInfo.event.clientY;

      // Joystick center is at 75px from left, 75px from bottom
      const screenCenterX = this.centerX;
      const screenCenterY = window.innerHeight - this.centerY;

      const distanceFromCenter = Math.sqrt(
        Math.pow(pointerX - screenCenterX, 2) +
        Math.pow(pointerY - screenCenterY, 2)
      );

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          // Only activate if touching in joystick area (within 100px of center)
          if (distanceFromCenter < 100) {
            this.isActive = true;
            console.log('🕹️ Joystick activated at', pointerX, pointerY);
          }
          break;

        case PointerEventTypes.POINTERMOVE:
          if (!this.isActive) return;

          // Calculate offset from center
          const deltaX = pointerX - screenCenterX;
          const deltaY = pointerY - screenCenterY;

          // Clamp to max distance
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          let thumbDeltaX = deltaX;
          let thumbDeltaY = deltaY;

          if (distance > this.maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            thumbDeltaX = Math.cos(angle) * this.maxDistance;
            thumbDeltaY = Math.sin(angle) * this.maxDistance;
          }

          // Update thumb position
          this.innerCircle.left = this.centerX + thumbDeltaX;
          this.innerCircle.top = -(this.centerY - thumbDeltaY);

          // Calculate normalized direction
          this.direction.x = thumbDeltaX / this.maxDistance;
          this.direction.y = -thumbDeltaY / this.maxDistance; // Invert Y for game coordinates

          // Clamp to -1, 1 range
          this.direction.x = Math.max(-1, Math.min(1, this.direction.x));
          this.direction.y = Math.max(-1, Math.min(1, this.direction.y));

          console.log('🕹️ Direction:', this.direction.x.toFixed(2), this.direction.y.toFixed(2));
          break;

        case PointerEventTypes.POINTERUP:
          if (!this.isActive) return;

          this.isActive = false;
          console.log('🕹️ Joystick released');

          // Reset thumb to center
          this.innerCircle.left = this.centerX;
          this.innerCircle.top = -this.centerY;

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

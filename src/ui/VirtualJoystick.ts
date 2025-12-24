import {
  AdvancedDynamicTexture,
  Ellipse,
  Control,
} from '@babylonjs/gui';
import { Vector2 } from '@babylonjs/core';

export class VirtualJoystick {
  private outerCircle: Ellipse;
  private innerCircle: Ellipse;
  private direction: Vector2 = Vector2.Zero();
  private isActive: boolean = false;
  private centerPosition: Vector2 = Vector2.Zero();
  private maxDistance: number = 50;

  constructor(advancedTexture: AdvancedDynamicTexture) {
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

    this.setupPointerEvents(advancedTexture);
  }

  private setupPointerEvents(_advancedTexture: AdvancedDynamicTexture): void {
    // Touch/pointer events for joystick
    this.outerCircle.onPointerDownObservable.add(() => {
      this.isActive = true;
      this.centerPosition.x = typeof this.outerCircle.left === 'number' ? this.outerCircle.left : 75;
      this.centerPosition.y = typeof this.outerCircle.top === 'number' ? this.outerCircle.top : -75;
    });

    this.outerCircle.onPointerMoveObservable.add((coords) => {
      if (!this.isActive) return;

      // Calculate offset from center (in screen pixels)
      // Center position is in bottom-left relative coordinates
      const screenCenterX = 75; // outerCircle.left in pixels from left
      const screenCenterY = window.innerHeight - 75; // from top

      const deltaX = coords.x - screenCenterX;
      const deltaY = coords.y - screenCenterY;

      // Clamp to max distance
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      let thumbDeltaX = deltaX;
      let thumbDeltaY = deltaY;

      if (distance > this.maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        thumbDeltaX = Math.cos(angle) * this.maxDistance;
        thumbDeltaY = Math.sin(angle) * this.maxDistance;
      }

      this.innerCircle.left = this.centerPosition.x + thumbDeltaX;
      this.innerCircle.top = this.centerPosition.y + thumbDeltaY;

      // Calculate normalized direction
      this.direction.x = thumbDeltaX / this.maxDistance;
      this.direction.y = -thumbDeltaY / this.maxDistance; // Invert Y for game coordinates

      // Clamp to -1, 1 range
      this.direction.x = Math.max(-1, Math.min(1, this.direction.x));
      this.direction.y = Math.max(-1, Math.min(1, this.direction.y));
    });

    this.outerCircle.onPointerUpObservable.add(() => {
      if (!this.isActive) return;

      this.isActive = false;

      // Reset thumb to center
      this.innerCircle.left = this.outerCircle.left;
      this.innerCircle.top = this.outerCircle.top;

      // Clear direction
      this.direction = Vector2.Zero();
    });
  }

  public getDirection(): Vector2 {
    return this.direction.clone();
  }

  public isPressed(): boolean {
    return this.isActive;
  }
}

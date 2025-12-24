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
    // Outer circle (joystick base) - MUCH LARGER and HIGHLY VISIBLE
    this.outerCircle = new Ellipse();
    this.outerCircle.width = '280px'; // Much larger (was 200px)
    this.outerCircle.height = '280px';
    this.outerCircle.color = '#00FFFF'; // Cyan color for high visibility
    this.outerCircle.thickness = 8; // Thicker border
    this.outerCircle.alpha = 0.9; // Very visible
    this.outerCircle.background = 'rgba(0, 255, 255, 0.2)'; // Cyan tint
    this.outerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.outerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.outerCircle.left = '140px'; // Adjusted for larger size
    this.outerCircle.top = '-140px';
    advancedTexture.addControl(this.outerCircle);

    // Inner circle (joystick thumb) - MUCH LARGER and HIGHLY VISIBLE
    this.innerCircle = new Ellipse();
    this.innerCircle.width = '140px'; // Much larger (was 100px)
    this.innerCircle.height = '140px';
    this.innerCircle.color = '#FF00FF'; // Magenta color for contrast
    this.innerCircle.thickness = 8; // Thicker border
    this.innerCircle.background = 'rgba(255, 0, 255, 0.6)'; // Magenta fill
    this.innerCircle.alpha = 1.0; // Fully visible
    this.innerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.innerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.innerCircle.left = '140px'; // Same as outer to center
    this.innerCircle.top = '-140px'; // Same as outer to center
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

      // If touch is in joystick area, prevent default camera behavior
      const inJoystickArea = distanceFromCenter < 160; // Larger detection area

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          // Only activate if touching in joystick area (within 120px of center)
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

          // Clamp to max distance (larger for bigger joystick)
          const maxDist = 100; // Increased from 75
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          let thumbDeltaX = deltaX;
          let thumbDeltaY = deltaY;

          if (distance > maxDist) {
            const angle = Math.atan2(deltaY, deltaX);
            thumbDeltaX = Math.cos(angle) * maxDist;
            thumbDeltaY = Math.sin(angle) * maxDist;
          }

          // Update thumb position (convert to pixel string)
          this.innerCircle.left = `${140 + thumbDeltaX}px`;
          this.innerCircle.top = `${-(140 - thumbDeltaY)}px`;

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

          // Reset thumb to center
          this.innerCircle.left = '140px';
          this.innerCircle.top = '-140px';

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

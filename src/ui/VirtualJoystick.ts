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
    this.outerCircle.widthInPixels = 200;
    this.outerCircle.heightInPixels = 200;
    this.outerCircle.color = '#FF0000'; // Christmas red
    this.outerCircle.thickness = 8; // Thick border
    this.outerCircle.alpha = 0.95;
    this.outerCircle.background = 'rgba(255, 0, 0, 0.25)'; // Red tint
    this.outerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.outerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    // Left edge at 50px (center at 150px for 200px wide circle)
    this.outerCircle.leftInPixels = 50;
    this.outerCircle.topInPixels = 0; // Will be set dynamically based on screen height
    advancedTexture.addControl(this.outerCircle);

    // Inner circle (joystick thumb) - Christmas green theme
    this.innerCircle = new Ellipse();
    this.innerCircle.widthInPixels = 100;
    this.innerCircle.heightInPixels = 100;
    this.innerCircle.color = '#00FF00'; // Christmas green
    this.innerCircle.thickness = 8; // Thick border
    this.innerCircle.background = 'rgba(0, 255, 0, 0.7)'; // Green fill
    this.innerCircle.alpha = 1.0;
    this.innerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.innerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    // Left edge at 100px (center at 150px for 100px wide circle)
    this.innerCircle.leftInPixels = 100;
    this.innerCircle.topInPixels = 0; // Will be set dynamically
    advancedTexture.addControl(this.innerCircle);

    // Set initial Y position based on screen height
    this.updateVerticalPosition();

    this.setupPointerEvents();
  }

  private updateVerticalPosition(): void {
    // Position circles so their centers are at 150px from bottom
    // Outer circle: top edge at (window.innerHeight - 150 - 100) = height - 250
    // Inner circle: top edge at (window.innerHeight - 150 - 50) = height - 200
    this.outerCircle.topInPixels = window.innerHeight - 250;
    this.innerCircle.topInPixels = window.innerHeight - 200;
  }

  private setupPointerEvents(): void {
    // Use scene-level pointer observables for better mobile support
    this.scene.onPointerObservable.add((pointerInfo) => {
      const pointerX = pointerInfo.event.clientX;
      const pointerY = pointerInfo.event.clientY;

      // Joystick center is at 150px from left, 150px from bottom
      const screenCenterX = 150;
      const screenCenterY = window.innerHeight - 150;

      const distanceFromCenter = Math.sqrt(
        Math.pow(pointerX - screenCenterX, 2) +
        Math.pow(pointerY - screenCenterY, 2)
      );

      // Touch area slightly smaller than outer circle to avoid accidental touches
      // Outer circle radius is 100px, touch area is 85px
      const inJoystickArea = distanceFromCenter < 85;

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

          // Clamp to max distance (50px = inner circle can reach edge of outer)
          const maxDist = 50;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          let thumbDeltaX = deltaX;
          let thumbDeltaY = deltaY;

          if (distance > maxDist) {
            const angle = Math.atan2(deltaY, deltaX);
            thumbDeltaX = Math.cos(angle) * maxDist;
            thumbDeltaY = Math.sin(angle) * maxDist;
          }

          // Update thumb position (offset from center)
          // Center is at X=150, so left edge = 100 + delta
          this.innerCircle.leftInPixels = 100 + thumbDeltaX;
          // Center is at Y=150 from bottom, top edge = height - 200 - delta
          this.innerCircle.topInPixels = window.innerHeight - 200 - thumbDeltaY;

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
          this.innerCircle.leftInPixels = 100;
          this.innerCircle.topInPixels = window.innerHeight - 200;

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

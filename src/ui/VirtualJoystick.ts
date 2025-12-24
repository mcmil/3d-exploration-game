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
  private readonly centerX = 150; // Center X position from left
  private readonly centerYFromBottom = 150; // Center Y position from bottom

  constructor(advancedTexture: AdvancedDynamicTexture, scene: Scene) {
    this.scene = scene;

    console.log('🖥️  Window size:', window.innerWidth, 'x', window.innerHeight);

    // Outer circle (joystick base) - Christmas red theme
    this.outerCircle = new Ellipse();
    this.outerCircle.widthInPixels = 200;
    this.outerCircle.heightInPixels = 200;
    this.outerCircle.color = '#FF0000'; // Christmas red
    this.outerCircle.thickness = 8;
    this.outerCircle.alpha = 0.95;
    this.outerCircle.background = 'rgba(255, 0, 0, 0.25)';
    this.outerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.outerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.outerCircle.leftInPixels = 50;
    // Center at 150px from bottom, radius 100px, so BOTTOM edge at 50px from bottom
    this.outerCircle.topInPixels = 50;
    console.log('🔴 Outer circle position: left=50, top=50 (bottom edge 50px from bottom)');
    advancedTexture.addControl(this.outerCircle);

    // Inner circle (joystick thumb) - Christmas green theme
    this.innerCircle = new Ellipse();
    this.innerCircle.widthInPixels = 100;
    this.innerCircle.heightInPixels = 100;
    this.innerCircle.color = '#00FF00'; // Christmas green
    this.innerCircle.thickness = 8;
    this.innerCircle.background = 'rgba(0, 255, 0, 0.7)';
    this.innerCircle.alpha = 1.0;
    this.innerCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.innerCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.innerCircle.leftInPixels = 100;
    // Center at 150px from bottom, radius 50px, so BOTTOM edge at 100px from bottom
    this.innerCircle.topInPixels = 100;
    console.log('🟢 Inner circle position: left=100, top=100 (bottom edge 100px from bottom)');
    advancedTexture.addControl(this.innerCircle);

    this.setupPointerEvents();
  }

  private setupPointerEvents(): void {
    // Use scene-level pointer observables for better mobile support
    this.scene.onPointerObservable.add((pointerInfo) => {
      const pointerX = pointerInfo.event.clientX;
      const pointerY = pointerInfo.event.clientY;

      // Joystick center coordinates
      const screenCenterX = this.centerX;
      const screenCenterY = window.innerHeight - this.centerYFromBottom;

      const distanceFromCenter = Math.sqrt(
        Math.pow(pointerX - screenCenterX, 2) +
        Math.pow(pointerY - screenCenterY, 2)
      );

      // Touch area slightly smaller than outer circle to avoid accidental touches
      const inJoystickArea = distanceFromCenter < 85;

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          console.log('👆 Touch at:', pointerX, pointerY,
                      'Expected center:', screenCenterX, screenCenterY,
                      'Distance:', distanceFromCenter.toFixed(1),
                      'In area:', inJoystickArea);
          if (inJoystickArea) {
            this.isActive = true;
            pointerInfo.event.preventDefault();
          }
          break;

        case PointerEventTypes.POINTERMOVE:
          if (!this.isActive) return;
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

          // Update thumb position
          // X: left edge = 100 (centered) + thumbDeltaX (right is positive)
          this.innerCircle.leftInPixels = 100 + thumbDeltaX;
          // Y: topInPixels positions BOTTOM edge from bottom of screen
          // Center starts at 150px from bottom, bottom edge at 100px
          // Drag down (positive deltaY) moves center down: new bottom = 100 - thumbDeltaY
          this.innerCircle.topInPixels = 100 - thumbDeltaY;

          console.log('🕹️  Thumb delta:', thumbDeltaX.toFixed(1), thumbDeltaY.toFixed(1),
                      'New position:', this.innerCircle.leftInPixels, this.innerCircle.topInPixels);

          // Calculate normalized direction for game
          this.direction.x = thumbDeltaX / maxDist;
          // thumbDeltaY positive = drag down = move forward (positive direction)
          this.direction.y = thumbDeltaY / maxDist;

          // Clamp to -1, 1 range
          this.direction.x = Math.max(-1, Math.min(1, this.direction.x));
          this.direction.y = Math.max(-1, Math.min(1, this.direction.y));
          break;

        case PointerEventTypes.POINTERUP:
          if (!this.isActive) return;
          this.isActive = false;
          pointerInfo.event.preventDefault();

          // Reset thumb to center (bottom edge at 100px from bottom)
          this.innerCircle.leftInPixels = 100;
          this.innerCircle.topInPixels = 100;

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

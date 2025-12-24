import { VirtualJoystick as BabylonJoystick } from '@babylonjs/core';
import { Vector2 } from '@babylonjs/core';

export class VirtualJoystick {
  private joystick: BabylonJoystick;
  private direction: Vector2 = Vector2.Zero();

  constructor() {
    // Create left joystick for movement
    this.joystick = new BabylonJoystick(true); // true = left side

    // Make joystick always visible (not just on touch)
    this.joystick.alwaysVisible = true;

    // Set Christmas colors
    this.joystick.setJoystickColor('red');

    console.log('🕹️  Babylon.js built-in joystick initialized (always visible)');
  }

  public getDirection(): Vector2 {
    // Babylon's joystick provides deltaPosition when pressed
    if (this.joystick.pressed) {
      // deltaPosition gives us the offset from center
      const deltaX = this.joystick.deltaPosition.x;
      const deltaY = this.joystick.deltaPosition.y;

      // Babylon joystick max is around 60 pixels, but normalize more aggressively
      const maxDist = 30; // Smaller value = more sensitive
      this.direction.x = Math.max(-1, Math.min(1, deltaX / maxDist));
      this.direction.y = Math.max(-1, Math.min(1, deltaY / maxDist)); // Don't invert yet

      return this.direction.clone();
    }

    return Vector2.Zero();
  }

  public isPressed(): boolean {
    return this.joystick.pressed;
  }

  public dispose(): void {
    this.joystick.releaseCanvas();
  }
}

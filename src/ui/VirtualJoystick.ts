import { VirtualJoystick as BabylonJoystick } from '@babylonjs/core';
import { Vector2 } from '@babylonjs/core';

export class VirtualJoystick {
  private joystick: BabylonJoystick;
  private direction: Vector2 = Vector2.Zero();

  constructor() {
    // Create left joystick for movement
    this.joystick = new BabylonJoystick(true); // true = left side

    // Set Christmas colors
    this.joystick.setJoystickColor('red');

    console.log('🕹️  Babylon.js built-in joystick initialized');
  }

  public getDirection(): Vector2 {
    // Babylon's joystick doesn't provide normalized direction directly
    // We need to check if it's pressed and get the delta
    if (this.joystick.pressed) {
      // deltaPosition gives us the offset from center
      const deltaX = this.joystick.deltaPosition.x;
      const deltaY = this.joystick.deltaPosition.y;

      // Normalize to -1 to 1 range (Babylon joystick max is ~60 pixels)
      const maxDist = 60;
      this.direction.x = Math.max(-1, Math.min(1, deltaX / maxDist));
      this.direction.y = Math.max(-1, Math.min(1, -deltaY / maxDist)); // Invert Y

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

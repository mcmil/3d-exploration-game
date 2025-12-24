import { VirtualJoystick as BabylonJoystick } from '@babylonjs/core';
import { Vector2 } from '@babylonjs/core';

export class VirtualJoystick {
  private moveJoystick: BabylonJoystick;
  private cameraJoystick: BabylonJoystick;
  private direction: Vector2 = Vector2.Zero();
  private cameraRotation: Vector2 = Vector2.Zero();

  constructor() {
    // Create left joystick for movement
    this.moveJoystick = new BabylonJoystick(true); // true = left side
    this.moveJoystick.setJoystickColor('red');
    this.moveJoystick.alwaysVisible = true;

    // Create right joystick for camera control
    this.cameraJoystick = new BabylonJoystick(false); // false = right side
    this.cameraJoystick.setJoystickColor('green');
    this.cameraJoystick.alwaysVisible = true;

    console.log('🕹️  Two joysticks initialized: red (movement) and green (camera)');
  }

  public getDirection(): Vector2 {
    // Movement joystick
    if (this.moveJoystick.pressed) {
      const deltaX = this.moveJoystick.deltaPosition.x;
      const deltaY = this.moveJoystick.deltaPosition.y;

      // Hyper-sensitive normalization for instant response
      const maxDist = 12; // Very small = extremely sensitive
      this.direction.x = Math.max(-1, Math.min(1, deltaX / maxDist));
      this.direction.y = Math.max(-1, Math.min(1, deltaY / maxDist));

      return this.direction.clone();
    }

    return Vector2.Zero();
  }

  public getCameraRotation(): Vector2 {
    // Camera joystick
    if (this.cameraJoystick.pressed) {
      const deltaX = this.cameraJoystick.deltaPosition.x;
      const deltaY = this.cameraJoystick.deltaPosition.y;

      // Hyper-sensitive camera control
      const maxDist = 15;
      this.cameraRotation.x = Math.max(-1, Math.min(1, deltaX / maxDist));
      this.cameraRotation.y = Math.max(-1, Math.min(1, -deltaY / maxDist)); // Invert Y for natural camera

      return this.cameraRotation.clone();
    }

    return Vector2.Zero();
  }

  public isPressed(): boolean {
    return this.moveJoystick.pressed;
  }

  public dispose(): void {
    this.moveJoystick.releaseCanvas();
    this.cameraJoystick.releaseCanvas();
  }
}

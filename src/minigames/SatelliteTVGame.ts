import { Scene } from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Slider } from '@babylonjs/gui';

export class SatelliteTVGame {
  private scene: Scene;
  private overlay: AdvancedDynamicTexture | null = null;
  private targetAngle: number = 0;
  private currentAngle: number = 0;
  private timeRemaining: number = 20;
  private timerInterval: any = null;
  private onSuccessCallback: (() => void) | null = null;
  private onFailureCallback: (() => void) | null = null;
  private isActive: boolean = false;
  private timerText: TextBlock | null = null;
  private angleText: TextBlock | null = null;
  private slider: Slider | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public start(onSuccess: () => void, onFailure: () => void): void {
    if (this.isActive) return;

    this.isActive = true;
    this.onSuccessCallback = onSuccess;
    this.onFailureCallback = onFailure;
    this.timeRemaining = 20;

    // Random target angle between 30 and 330 degrees
    this.targetAngle = Math.floor(Math.random() * 300) + 30;
    this.currentAngle = 180; // Start at middle

    console.log('📡 Satellite TV Game started!');

    this.disableJoysticks();

    this.overlay = AdvancedDynamicTexture.CreateFullscreenUI('SatelliteTVGameUI', true, this.scene);
    this.overlay.layer!.layerMask = 0x0FFFFFFF;

    const background = new Rectangle('gameBg');
    background.width = 1.0;
    background.height = 1.0;
    background.background = 'rgba(0, 0, 0, 0.85)';
    background.zIndex = 5000;
    this.overlay.addControl(background);

    const title = new TextBlock('title');
    title.text = '📡 DOSTOSUJ ANTENĘ SATELITARNĄ 📡';
    title.color = '#4A9EFF';
    title.fontSize = 36;
    title.fontWeight = 'bold';
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    title.top = '20px';
    title.height = '60px';
    title.zIndex = 5001;
    this.overlay.addControl(title);

    const instructions = new TextBlock('instructions');
    instructions.text = 'Przesuń, aby dopasować kąt docelowy (±5°)';
    instructions.color = 'white';
    instructions.fontSize = 14;
    instructions.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    instructions.top = '85px';
    instructions.height = '30px';
    instructions.zIndex = 5001;
    this.overlay.addControl(instructions);

    this.timerText = new TextBlock('timer');
    this.timerText.text = `Czas: ${this.timeRemaining}s`;
    this.timerText.color = '#00FF00';
    this.timerText.fontSize = 28;
    this.timerText.fontWeight = 'bold';
    this.timerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.timerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.timerText.top = '20px';
    this.timerText.left = '-40px';
    this.timerText.height = '40px';
    this.timerText.zIndex = 5001;
    this.overlay.addControl(this.timerText);

    // Target angle display
    const targetText = new TextBlock('targetText');
    targetText.text = `Cel: ${this.targetAngle}°`;
    targetText.color = '#FFD700';
    targetText.fontSize = 32;
    targetText.fontWeight = 'bold';
    targetText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    targetText.top = '-80px';
    targetText.height = '40px';
    targetText.zIndex = 5001;
    this.overlay.addControl(targetText);

    // Current angle display
    this.angleText = new TextBlock('angleText');
    this.angleText.text = `Aktualny: ${this.currentAngle}°`;
    this.angleText.color = 'white';
    this.angleText.fontSize = 28;
    this.angleText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.angleText.top = '-30px';
    this.angleText.height = '40px';
    this.angleText.zIndex = 5001;
    this.overlay.addControl(this.angleText);

    // Slider
    this.slider = new Slider('angleSlider');
    this.slider.minimum = 0;
    this.slider.maximum = 360;
    this.slider.value = this.currentAngle;
    this.slider.height = '40px';
    this.slider.width = '600px';
    this.slider.color = '#4A9EFF';
    this.slider.background = '#333333';
    this.slider.borderColor = 'white';
    this.slider.thumbWidth = '30px';
    this.slider.isThumbCircle = true;
    this.slider.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.slider.top = '40px';
    this.slider.zIndex = 5002;

    this.slider.onValueChangedObservable.add((value) => {
      this.currentAngle = Math.round(value);
      if (this.angleText) {
        this.angleText.text = `Aktualny: ${this.currentAngle}°`;

        // Check if aligned
        const diff = Math.abs(this.currentAngle - this.targetAngle);
        if (diff <= 5) {
          this.angleText.color = '#00FF00';
        } else {
          this.angleText.color = 'white';
        }
      }
    });

    this.overlay.addControl(this.slider);

    // Submit button
    const submitBtn = new Rectangle('submitBtn');
    submitBtn.width = '200px';
    submitBtn.height = '60px';
    submitBtn.cornerRadius = 10;
    submitBtn.color = 'white';
    submitBtn.thickness = 4;
    submitBtn.background = '#00AA00';
    submitBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    submitBtn.top = '140px';
    submitBtn.zIndex = 5002;

    const submitText = new TextBlock('submitText');
    submitText.text = 'POTWIERDŹ';
    submitText.color = 'white';
    submitText.fontSize = 24;
    submitText.fontWeight = 'bold';
    submitBtn.addControl(submitText);

    submitBtn.onPointerClickObservable.add(() => {
      this.checkAlignment();
    });

    this.overlay.addControl(submitBtn);

    this.startTimer();
    console.log('🎮 Align the satellite dish!');
  }

  private disableJoysticks(): void {
    const joystickCanvases = document.querySelectorAll('canvas');
    joystickCanvases.forEach((canvas) => {
      if (canvas.id !== 'renderCanvas') {
        (canvas as HTMLCanvasElement).style.zIndex = '-1';
      }
    });
  }

  private enableJoysticks(): void {
    const joystickCanvases = document.querySelectorAll('canvas');
    joystickCanvases.forEach((canvas) => {
      if (canvas.id !== 'renderCanvas') {
        (canvas as HTMLCanvasElement).style.zIndex = '1';
      }
    });
  }

  private checkAlignment(): void {
    const diff = Math.abs(this.currentAngle - this.targetAngle);
    if (diff <= 5) {
      this.onSuccess();
    } else {
      // Flash red
      if (this.angleText) {
        const originalColor = this.angleText.color;
        this.angleText.color = '#FF0000';
        setTimeout(() => {
          if (this.angleText) this.angleText.color = originalColor;
        }, 200);
      }
      console.log(`❌ Not aligned! Off by ${diff}°`);
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (this.timerText) {
        this.timerText.text = `Czas: ${this.timeRemaining}s`;
        if (this.timeRemaining <= 5) {
          this.timerText.color = '#FF0000';
        } else if (this.timeRemaining <= 10) {
          this.timerText.color = '#FFA500';
        }
      }

      if (this.timeRemaining <= 0) {
        this.onFailure();
      }
    }, 1000);
  }

  private onSuccess(): void {
    console.log('🎉 Satellite aligned! Success!');
    this.isActive = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.overlay) {
      const successMsg = new TextBlock('successMsg');
      successMsg.text = '✅ SYGNAŁ ZABLOKOWANY!';
      successMsg.color = '#00FF00';
      successMsg.fontSize = 48;
      successMsg.fontWeight = 'bold';
      successMsg.zIndex = 5003;
      this.overlay.addControl(successMsg);
    }

    setTimeout(() => {
      this.enableJoysticks();
      this.close();
      if (this.onSuccessCallback) {
        this.onSuccessCallback();
      }
    }, 1500);
  }

  private onFailure(): void {
    console.log('❌ Time up! Satellite game failed.');
    this.isActive = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.overlay) {
      const failMsg = new TextBlock('failMsg');
      failMsg.text = '❌ KONIEC CZASU! SPRÓBUJ PONOWNIE';
      failMsg.color = '#FF0000';
      failMsg.fontSize = 48;
      failMsg.fontWeight = 'bold';
      failMsg.zIndex = 5003;
      this.overlay.addControl(failMsg);
    }

    setTimeout(() => {
      this.enableJoysticks();
      this.close();
      if (this.onFailureCallback) {
        this.onFailureCallback();
      }
    }, 1500);
  }

  private close(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.overlay) {
      this.overlay.dispose();
      this.overlay = null;
    }

    this.isActive = false;
  }

  public dispose(): void {
    this.close();
  }
}

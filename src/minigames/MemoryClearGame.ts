import { Scene } from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button } from '@babylonjs/gui';

export class MemoryClearGame {
  private scene: Scene;
  private overlay: AdvancedDynamicTexture | null = null;
  private sequence: number[] = [];
  private playerSequence: number[] = [];
  private sequenceLength: number = 5;
  private showingSequence: boolean = false;
  private timeRemaining: number = 25;
  private timerInterval: any = null;
  private onSuccessCallback: (() => void) | null = null;
  private onFailureCallback: (() => void) | null = null;
  private isActive: boolean = false;
  private timerText: TextBlock | null = null;
  private statusText: TextBlock | null = null;
  private buttons: Button[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public start(onSuccess: () => void, onFailure: () => void): void {
    if (this.isActive) return;

    this.isActive = true;
    this.onSuccessCallback = onSuccess;
    this.onFailureCallback = onFailure;
    this.timeRemaining = 25;
    this.playerSequence = [];

    // Generate random sequence
    this.sequence = [];
    for (let i = 0; i < this.sequenceLength; i++) {
      this.sequence.push(Math.floor(Math.random() * 4));
    }

    console.log('💾 Memory Clear Game started!');

    this.disableJoysticks();

    this.overlay = AdvancedDynamicTexture.CreateFullscreenUI('MemoryClearGameUI', true, this.scene);
    this.overlay.layer!.layerMask = 0x0FFFFFFF;

    const background = new Rectangle('gameBg');
    background.width = 1.0;
    background.height = 1.0;
    background.background = 'rgba(0, 0, 0, 0.85)';
    background.zIndex = 5000;
    this.overlay.addControl(background);

    const title = new TextBlock('title');
    title.text = '💾 SEKWENCJA PAMIĘCI 💾';
    title.color = '#C77DFF';
    title.fontSize = 32;
    title.fontWeight = 'bold';
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    title.top = '40px';
    title.height = '50px';
    title.zIndex = 5001;
    this.overlay.addControl(title);

    const instructions = new TextBlock('instructions');
    instructions.text = 'Obserwuj sekwencję, potem powtórz!';
    instructions.color = 'white';
    instructions.fontSize = 14;
    instructions.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    instructions.top = '100px';
    instructions.height = '30px';
    instructions.zIndex = 5001;
    this.overlay.addControl(instructions);

    this.timerText = new TextBlock('timer');
    this.timerText.text = `Czas: ${this.timeRemaining}s`;
    this.timerText.color = '#00FF00';
    this.timerText.fontSize = 24;
    this.timerText.fontWeight = 'bold';
    this.timerText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.timerText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.timerText.top = '40px';
    this.timerText.left = '-40px';
    this.timerText.height = '30px';
    this.timerText.zIndex = 5001;
    this.overlay.addControl(this.timerText);

    this.statusText = new TextBlock('status');
    this.statusText.text = 'Obserwuj uważnie...';
    this.statusText.color = '#FFD700';
    this.statusText.fontSize = 20;
    this.statusText.fontWeight = 'bold';
    this.statusText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.statusText.top = '150px';
    this.statusText.height = '30px';
    this.statusText.zIndex = 5001;
    this.overlay.addControl(this.statusText);

    this.createButtons();
    this.startTimer();

    // Show sequence after 1 second
    setTimeout(() => {
      this.showSequence();
    }, 1000);

    console.log('🎮 Memorize the sequence!');
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

  private createButtons(): void {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];
    const positions = [
      { x: -120, y: -60 },
      { x: 120, y: -60 },
      { x: -120, y: 60 },
      { x: 120, y: 60 }
    ];

    for (let i = 0; i < 4; i++) {
      const button = Button.CreateSimpleButton(`memBtn_${i}`, `${i + 1}`);
      button.width = '150px';
      button.height = '100px';
      button.color = 'white';
      button.background = colors[i];
      button.fontSize = 40;
      button.fontWeight = 'bold';
      button.cornerRadius = 15;
      button.thickness = 5;
      button.left = `${positions[i].x}px`;
      button.top = `${positions[i].y}px`;
      button.zIndex = 5002;
      button.alpha = 0.5; // Disabled during sequence

      button.onPointerClickObservable.add(() => {
        if (!this.showingSequence && this.isActive) {
          this.handleButtonClick(i, button);
        }
      });

      this.overlay!.addControl(button);
      this.buttons.push(button);
    }
  }

  private async showSequence(): Promise<void> {
    this.showingSequence = true;

    if (this.statusText) {
      this.statusText.text = 'Obserwuj uważnie...';
    }

    for (let i = 0; i < this.sequence.length; i++) {
      const btnIdx = this.sequence[i];
      const button = this.buttons[btnIdx];

      // Flash button
      button.alpha = 1.0;
      button.thickness = 8;

      await this.wait(600);

      button.alpha = 0.5;
      button.thickness = 5;

      await this.wait(400);
    }

    // Enable buttons
    this.showingSequence = false;
    this.buttons.forEach(btn => {
      btn.alpha = 1.0;
    });

    if (this.statusText) {
      this.statusText.text = 'Teraz powtórz sekwencję!';
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleButtonClick(index: number, button: Button): void {
    // Flash button
    const originalThickness = button.thickness;
    button.thickness = 8;
    setTimeout(() => {
      button.thickness = originalThickness;
    }, 150);

    this.playerSequence.push(index);

    // Check if correct so far
    const currentStep = this.playerSequence.length - 1;
    if (this.playerSequence[currentStep] !== this.sequence[currentStep]) {
      // Wrong!
      this.onWrongSequence();
      return;
    }

    // Check if complete
    if (this.playerSequence.length === this.sequence.length) {
      this.onSuccess();
    } else {
      if (this.statusText) {
        this.statusText.text = `Postęp: ${this.playerSequence.length}/${this.sequence.length}`;
      }
    }
  }

  private onWrongSequence(): void {
    console.log('❌ Wrong sequence!');

    if (this.statusText) {
      this.statusText.text = '❌ ŹLE! Spróbuj ponownie...';
      this.statusText.color = '#FF0000';
    }

    // Flash all buttons red
    this.buttons.forEach(btn => {
      const originalBg = btn.background;
      btn.background = '#FF0000';
      setTimeout(() => {
        btn.background = originalBg;
      }, 300);
    });

    // Reset and show sequence again
    this.playerSequence = [];
    setTimeout(() => {
      if (this.statusText) {
        this.statusText.color = '#FFD700';
      }
      this.showSequence();
    }, 1500);
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
    console.log('🎉 Sequence complete! Success!');
    this.isActive = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.overlay) {
      const successMsg = new TextBlock('successMsg');
      successMsg.text = '✅ PAMIĘĆ WYCZYSZCZONA!';
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
    console.log('❌ Time up! Memory game failed.');
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

    this.buttons = [];
    this.isActive = false;
  }

  public dispose(): void {
    this.close();
  }
}

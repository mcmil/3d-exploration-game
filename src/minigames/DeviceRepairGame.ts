import { Scene } from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button } from '@babylonjs/gui';

interface DevicePart {
  id: number;
  name: string;
  button: Button;
  broken: boolean;
}

export class DeviceRepairGame {
  private scene: Scene;
  private overlay: AdvancedDynamicTexture | null = null;
  private parts: DevicePart[] = [];
  private brokenParts: number[] = [];
  private fixedCount: number = 0;
  private timeRemaining: number = 15;
  private timerInterval: any = null;
  private onSuccessCallback: (() => void) | null = null;
  private onFailureCallback: (() => void) | null = null;
  private isActive: boolean = false;
  private timerText: TextBlock | null = null;
  private progressText: TextBlock | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public start(onSuccess: () => void, onFailure: () => void): void {
    if (this.isActive) return;

    this.isActive = true;
    this.onSuccessCallback = onSuccess;
    this.onFailureCallback = onFailure;
    this.timeRemaining = 15;
    this.fixedCount = 0;

    // Randomly select 3 broken parts out of 6
    const allParts = [0, 1, 2, 3, 4, 5];
    this.brokenParts = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * allParts.length);
      this.brokenParts.push(allParts[idx]);
      allParts.splice(idx, 1);
    }

    console.log('🔧 Device Repair Game started!');

    this.disableJoysticks();

    this.overlay = AdvancedDynamicTexture.CreateFullscreenUI('DeviceRepairGameUI', true, this.scene);
    this.overlay.layer!.layerMask = 0x0FFFFFFF;

    const background = new Rectangle('gameBg');
    background.width = 1.0;
    background.height = 1.0;
    background.background = 'rgba(0, 0, 0, 0.85)';
    background.zIndex = 5000;
    this.overlay.addControl(background);

    const title = new TextBlock('title');
    title.text = '🔧 DIAGNOZUJ I NAPRAW 🔧';
    title.color = '#FFD700';
    title.fontSize = 36;
    title.fontWeight = 'bold';
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    title.top = '60px';
    title.height = '60px';
    title.zIndex = 5001;
    this.overlay.addControl(title);

    const instructions = new TextBlock('instructions');
    instructions.text = 'Znajdź i dotknij 3 uszkodzone komponenty (czerwone)';
    instructions.color = 'white';
    instructions.fontSize = 14;
    instructions.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    instructions.top = '150px';
    instructions.height = '30px';
    instructions.zIndex = 5001;
    this.overlay.addControl(instructions);

    this.timerText = new TextBlock('timer');
    this.timerText.text = `Czas: ${this.timeRemaining}s`;
    this.timerText.color = '#00FF00';
    this.timerText.fontSize = 28;
    this.timerText.fontWeight = 'bold';
    this.timerText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.timerText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.timerText.top = '60px';
    this.timerText.left = '-40px';
    this.timerText.height = '40px';
    this.timerText.zIndex = 5001;
    this.overlay.addControl(this.timerText);

    this.progressText = new TextBlock('progress');
    this.progressText.text = 'Naprawione: 0/3';
    this.progressText.color = 'white';
    this.progressText.fontSize = 24;
    this.progressText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.progressText.top = '200px';
    this.progressText.height = '40px';
    this.progressText.zIndex = 5001;
    this.overlay.addControl(this.progressText);

    this.createParts();
    this.startTimer();

    console.log('🎮 Find the broken components!');
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

  private createParts(): void {
    const partNames = ['CPU', 'RAM', 'GPU', 'PSU', 'SSD', 'FAN'];
    const positions = [
      { x: -250, y: -50 },
      { x: 0, y: -50 },
      { x: 250, y: -50 },
      { x: -250, y: 50 },
      { x: 0, y: 50 },
      { x: 250, y: 50 }
    ];

    for (let i = 0; i < 6; i++) {
      const isBroken = this.brokenParts.includes(i);

      const button = Button.CreateSimpleButton(`part_${i}`, partNames[i]);
      button.width = '140px';
      button.height = '80px';
      button.color = 'white';
      button.background = isBroken ? '#AA0000' : '#00AA00'; // Red if broken, green if ok
      button.fontSize = 20;
      button.fontWeight = 'bold';
      button.cornerRadius = 10;
      button.thickness = 4;
      button.left = `${positions[i].x}px`;
      button.top = `${positions[i].y}px`;
      button.zIndex = 5002;

      const part: DevicePart = {
        id: i,
        name: partNames[i],
        button: button,
        broken: isBroken
      };

      button.onPointerClickObservable.add(() => {
        this.handlePartClick(part);
      });

      this.overlay!.addControl(button);
      this.parts.push(part);
    }
  }

  private handlePartClick(part: DevicePart): void {
    if (!this.isActive) return;

    if (part.broken && part.button.background === '#AA0000') {
      // Correct! Fixed broken part
      part.button.background = '#00FF00';
      this.fixedCount++;

      if (this.progressText) {
        this.progressText.text = `Naprawione: ${this.fixedCount}/3`;
      }

      console.log(`✅ Fixed ${part.name}!`);

      if (this.fixedCount === 3) {
        this.onSuccess();
      }
    } else if (!part.broken) {
      // Wrong! This part isn't broken
      const originalBg = part.button.background;
      part.button.background = '#FFAA00'; // Flash orange
      setTimeout(() => {
        part.button.background = originalBg;
      }, 200);

      console.log(`❌ ${part.name} is not broken!`);
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
    console.log('🎉 All parts repaired! Success!');
    this.isActive = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.overlay) {
      const successMsg = new TextBlock('successMsg');
      successMsg.text = '✅ URZĄDZENIE NAPRAWIONE!';
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
    console.log('❌ Time up! Device repair failed.');
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

    this.parts = [];
    this.isActive = false;
  }

  public dispose(): void {
    this.close();
  }
}

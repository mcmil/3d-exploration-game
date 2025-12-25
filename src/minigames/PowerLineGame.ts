import { Scene } from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Ellipse } from '@babylonjs/gui';

interface Connection {
  id: number;
  fixed: boolean;
  button: Ellipse;
}

export class PowerLineGame {
  private scene: Scene;
  private overlay: AdvancedDynamicTexture | null = null;
  private connections: Connection[] = [];
  private currentIndex: number = 0;
  private timeRemaining: number = 15; // 15 seconds to complete
  private timerInterval: any = null;
  private onSuccessCallback: (() => void) | null = null;
  private onFailureCallback: (() => void) | null = null;
  private isActive: boolean = false;

  private timerText: TextBlock | null = null;
  private progressText: TextBlock | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Start the power line mini-game
   */
  public start(onSuccess: () => void, onFailure: () => void): void {
    if (this.isActive) return;

    this.isActive = true;
    this.onSuccessCallback = onSuccess;
    this.onFailureCallback = onFailure;
    this.currentIndex = 0;
    this.timeRemaining = 15;

    console.log('⚡ Power Line Game started!');

    // Disable joysticks by lowering their z-index
    this.disableJoysticks();

    // Create fullscreen overlay with high z-index
    this.overlay = AdvancedDynamicTexture.CreateFullscreenUI('PowerLineGameUI', true, this.scene);
    this.overlay.layer!.layerMask = 0x0FFFFFFF; // High priority layer

    // Create background
    const background = new Rectangle('gameBg');
    background.width = 1.0;
    background.height = 1.0;
    background.background = 'rgba(0, 0, 0, 0.85)';
    background.zIndex = 5000;
    this.overlay.addControl(background);

    // Create title - moved higher
    const title = new TextBlock('title');
    title.text = '⚡ NAPRAW LINIĘ ELEKTRYCZNĄ ⚡';
    title.color = '#FFD700';
    title.fontSize = 36;
    title.fontWeight = 'bold';
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    title.top = '20px'; // Moved from 40px
    title.height = '60px';
    title.zIndex = 5001;
    this.overlay.addControl(title);

    // Create instructions - at very bottom
    const instructions = new TextBlock('instructions');
    instructions.text = 'Dotknij połączenia po kolei: 1 → 2 → 3 → 4 → 5';
    instructions.color = 'white';
    instructions.fontSize = 16;
    instructions.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    instructions.top = '-80px';
    instructions.height = '40px';
    instructions.zIndex = 5001;
    this.overlay.addControl(instructions);

    // Create timer
    this.timerText = new TextBlock('timer');
    this.timerText.text = `Czas: ${this.timeRemaining}s`;
    this.timerText.color = '#00FF00';
    this.timerText.fontSize = 28;
    this.timerText.fontWeight = 'bold';
    this.timerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.timerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.timerText.top = '20px'; // Moved from 40px
    this.timerText.left = '-40px';
    this.timerText.height = '40px';
    this.timerText.zIndex = 5001;
    this.overlay.addControl(this.timerText);

    // Create progress text
    this.progressText = new TextBlock('progress');
    this.progressText.text = 'Połączenia: 0/5';
    this.progressText.color = 'white';
    this.progressText.fontSize = 24;
    this.progressText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.progressText.top = '130px'; // Moved from 150px
    this.progressText.height = '40px';
    this.progressText.zIndex = 5001;
    this.overlay.addControl(this.progressText);

    // Create 5 connection points
    this.createConnections();

    // Start timer
    this.startTimer();

    console.log('🎮 Tap connections 1-5 in order!');
  }

  /**
   * Disable joysticks by lowering their z-index
   */
  private disableJoysticks(): void {
    const joystickCanvases = document.querySelectorAll('canvas');
    joystickCanvases.forEach((canvas) => {
      if (canvas.id !== 'renderCanvas') {
        (canvas as HTMLCanvasElement).style.zIndex = '-1';
      }
    });
  }

  /**
   * Re-enable joysticks by restoring their z-index
   */
  private enableJoysticks(): void {
    const joystickCanvases = document.querySelectorAll('canvas');
    joystickCanvases.forEach((canvas) => {
      if (canvas.id !== 'renderCanvas') {
        (canvas as HTMLCanvasElement).style.zIndex = '1';
      }
    });
  }

  /**
   * Create 5 connection point buttons
   */
  private createConnections(): void {
    const positions = [
      { x: -300, y: 0 },   // Left
      { x: -150, y: -80 }, // Top-left
      { x: 0, y: 0 },      // Center
      { x: 150, y: 80 },   // Bottom-right
      { x: 300, y: 0 }     // Right
    ];

    for (let i = 0; i < 5; i++) {
      // Create connection button (circle)
      const button = new Ellipse(`connection_${i}`);
      button.width = '100px';
      button.height = '100px';
      button.thickness = 5;
      button.color = 'white';
      button.background = '#333333';
      button.left = `${positions[i].x}px`;
      button.top = `${positions[i].y}px`;
      button.zIndex = 5002; // Above all other UI

      // Add number label
      const label = new TextBlock(`label_${i}`);
      label.text = `${i + 1}`;
      label.color = 'white';
      label.fontSize = 40;
      label.fontWeight = 'bold';
      button.addControl(label);

      // Add to overlay
      this.overlay!.addControl(button);

      // Store connection data
      const connection: Connection = {
        id: i,
        fixed: false,
        button: button
      };
      this.connections.push(connection);

      // Add click handler
      button.onPointerClickObservable.add(() => {
        this.handleConnectionTap(connection);
      });
    }
  }

  /**
   * Handle tapping a connection point
   */
  private handleConnectionTap(connection: Connection): void {
    if (!this.isActive || connection.fixed) return;

    // Check if tapped in correct order
    if (connection.id === this.currentIndex) {
      // Correct! Mark as fixed
      connection.fixed = true;
      connection.button.background = '#00FF00'; // Green
      connection.button.color = '#00AA00';
      this.currentIndex++;

      // Update progress
      if (this.progressText) {
        this.progressText.text = `Połączenia: ${this.currentIndex}/5`;
      }

      // Play success sound (visual feedback for now)
      console.log(`✅ Connection ${connection.id + 1} fixed!`);

      // Check if all connections fixed
      if (this.currentIndex === 5) {
        this.onSuccess();
      }
    } else {
      // Wrong connection! Flash red
      const originalBg = connection.button.background;
      connection.button.background = '#FF0000';
      setTimeout(() => {
        connection.button.background = originalBg;
      }, 200);

      console.log(`❌ Wrong connection! Tap #${this.currentIndex + 1}`);
    }
  }

  /**
   * Start countdown timer
   */
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (this.timerText) {
        this.timerText.text = `Czas: ${this.timeRemaining}s`;

        // Change color as time runs out
        if (this.timeRemaining <= 5) {
          this.timerText.color = '#FF0000'; // Red
        } else if (this.timeRemaining <= 10) {
          this.timerText.color = '#FFA500'; // Orange
        }
      }

      // Time's up!
      if (this.timeRemaining <= 0) {
        this.onFailure();
      }
    }, 1000);
  }

  /**
   * Called when player successfully completes the game
   */
  private onSuccess(): void {
    console.log('🎉 Power line fixed! Success!');
    this.isActive = false;

    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Show success message
    if (this.overlay) {
      const successMsg = new TextBlock('successMsg');
      successMsg.text = '✅ ZASILANIE PRZYWRÓCONE!';
      successMsg.color = '#00FF00';
      successMsg.fontSize = 48;
      successMsg.fontWeight = 'bold';
      successMsg.zIndex = 5003;
      this.overlay.addControl(successMsg);
    }

    // Close after 1.5 seconds
    setTimeout(() => {
      this.enableJoysticks(); // Re-enable joysticks
      this.close();
      if (this.onSuccessCallback) {
        this.onSuccessCallback();
      }
    }, 1500);
  }

  /**
   * Called when player fails (time runs out)
   */
  private onFailure(): void {
    console.log('❌ Time up! Power line game failed.');
    this.isActive = false;

    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Show failure message
    if (this.overlay) {
      const failMsg = new TextBlock('failMsg');
      failMsg.text = '❌ KONIEC CZASU! SPRÓBUJ PONOWNIE';
      failMsg.color = '#FF0000';
      failMsg.fontSize = 48;
      failMsg.fontWeight = 'bold';
      failMsg.zIndex = 5003;
      this.overlay.addControl(failMsg);
    }

    // Close after 1.5 seconds
    setTimeout(() => {
      this.enableJoysticks(); // Re-enable joysticks
      this.close();
      if (this.onFailureCallback) {
        this.onFailureCallback();
      }
    }, 1500);
  }

  /**
   * Close and clean up the mini-game
   */
  private close(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.overlay) {
      this.overlay.dispose();
      this.overlay = null;
    }

    this.connections = [];
    this.currentIndex = 0;
    this.isActive = false;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.close();
  }
}

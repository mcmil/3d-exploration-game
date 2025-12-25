import { AdvancedDynamicTexture, TextBlock, Rectangle, Control, Button } from '@babylonjs/gui';
import { Scene } from '@babylonjs/core';

export class HUD {
  private advancedTexture: AdvancedDynamicTexture;
  private scene: Scene;

  // UI Elements
  private objectiveText: TextBlock;
  private questCounter: TextBlock;
  private interactionPrompt: Rectangle;
  private interactionButton: Button;

  constructor(scene: Scene) {
    this.scene = scene;

    // Create fullscreen UI texture
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

    // Initialize UI elements
    this.objectiveText = this.createObjectiveText();
    this.questCounter = this.createQuestCounter();
    this.interactionPrompt = this.createInteractionPrompt();
    this.interactionButton = this.createInteractionButton();

    console.log('📊 HUD initialized!');
  }

  /**
   * Create objective text at top of screen
   */
  private createObjectiveText(): TextBlock {
    const text = new TextBlock('objectiveText');
    text.text = 'Walk to houses with colored markers above them';
    text.color = 'white';
    text.fontSize = 20;
    text.fontWeight = 'bold';
    text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    text.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    text.top = '20px';
    text.height = '40px';
    text.shadowColor = 'black';
    text.shadowBlur = 8;
    text.shadowOffsetX = 2;
    text.shadowOffsetY = 2;

    this.advancedTexture.addControl(text);
    return text;
  }

  /**
   * Create quest counter at top right
   */
  private createQuestCounter(): TextBlock {
    const counter = new TextBlock('questCounter');
    counter.text = 'Tasks: 0/0';
    counter.color = '#FFD700'; // Gold
    counter.fontSize = 24;
    counter.fontWeight = 'bold';
    counter.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    counter.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    counter.top = '20px';
    counter.left = '-20px';
    counter.height = '40px';
    counter.shadowColor = 'black';
    counter.shadowBlur = 8;
    counter.shadowOffsetX = 2;
    counter.shadowOffsetY = 2;

    this.advancedTexture.addControl(counter);
    return counter;
  }

  /**
   * Create interaction prompt (shown when near house)
   */
  private createInteractionPrompt(): Rectangle {
    const promptBg = new Rectangle('interactionPromptBg');
    promptBg.width = '400px';
    promptBg.height = '80px';
    promptBg.cornerRadius = 10;
    promptBg.color = 'white';
    promptBg.thickness = 3;
    promptBg.background = 'rgba(0, 0, 0, 0.7)';
    promptBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    promptBg.top = '-120px';
    promptBg.isVisible = false; // Hidden by default

    const promptText = new TextBlock('interactionPromptText');
    promptText.text = 'Tap the button to interact';
    promptText.color = 'white';
    promptText.fontSize = 18;
    promptText.fontWeight = 'bold';

    promptBg.addControl(promptText);
    this.advancedTexture.addControl(promptBg);

    return promptBg;
  }

  /**
   * Create interaction button (shown when near house)
   */
  private createInteractionButton(): Button {
    const button = Button.CreateSimpleButton('interactionButton', 'FIX PROBLEM');
    button.width = '200px';
    button.height = '80px';
    button.color = 'white';
    button.background = '#00AA00'; // Green
    button.fontSize = 24;
    button.fontWeight = 'bold';
    button.cornerRadius = 10;
    button.thickness = 4;
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    button.top = '-30px';
    button.left = '-30px';
    button.isVisible = false; // Hidden by default
    button.shadowColor = 'black';
    button.shadowBlur = 10;

    // Hover effects
    button.onPointerEnterObservable.add(() => {
      button.background = '#00CC00';
    });
    button.onPointerOutObservable.add(() => {
      button.background = '#00AA00';
    });

    this.advancedTexture.addControl(button);
    return button;
  }

  /**
   * Update objective text
   */
  public updateObjective(text: string): void {
    this.objectiveText.text = text;
  }

  /**
   * Update quest counter
   */
  public updateQuestCount(completed: number, total: number): void {
    this.questCounter.text = `Tasks: ${completed}/${total}`;

    // Change color based on progress
    if (completed === total && total > 0) {
      this.questCounter.color = '#00FF00'; // Green when complete
    } else {
      this.questCounter.color = '#FFD700'; // Gold during progress
    }
  }

  /**
   * Show interaction prompt and button
   */
  public showInteractionPrompt(questType: string): void {
    this.interactionPrompt.isVisible = true;
    this.interactionButton.isVisible = true;

    // Update prompt text based on quest type
    const promptText = this.interactionPrompt.children[0] as TextBlock;
    const questNames: { [key: string]: string } = {
      power_outage: 'Fix Power Outage',
      satellite_tv: 'Fix Satellite TV',
      device_repair: 'Repair Device',
      memory_clear: 'Clear Memory'
    };

    promptText.text = questNames[questType] || 'Fix Problem';
    this.interactionButton.textBlock!.text = questNames[questType] || 'FIX PROBLEM';
  }

  /**
   * Hide interaction prompt and button
   */
  public hideInteractionPrompt(): void {
    this.interactionPrompt.isVisible = false;
    this.interactionButton.isVisible = false;
  }

  /**
   * Set interaction button callback
   */
  public onInteractionButtonClick(callback: () => void): void {
    this.interactionButton.onPointerClickObservable.clear();
    this.interactionButton.onPointerClickObservable.add(callback);
  }

  /**
   * Show completion message
   */
  public showCompletionMessage(): void {
    this.updateObjective('🎉 All tasks completed! Great job!');
    this.hideInteractionPrompt();

    // Create celebration text
    const celebration = new TextBlock('celebration');
    celebration.text = 'YOU WIN! 🎄';
    celebration.color = '#FFD700';
    celebration.fontSize = 48;
    celebration.fontWeight = 'bold';
    celebration.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    celebration.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    celebration.shadowColor = 'black';
    celebration.shadowBlur = 15;
    celebration.shadowOffsetX = 3;
    celebration.shadowOffsetY = 3;

    this.advancedTexture.addControl(celebration);

    // Animate celebration text
    let scale = 0.5;
    let growing = true;
    this.scene.registerBeforeRender(() => {
      if (growing) {
        scale += 0.02;
        if (scale >= 1.2) growing = false;
      } else {
        scale -= 0.02;
        if (scale <= 0.8) growing = true;
      }
      celebration.fontSize = 48 * scale;
    });
  }

  /**
   * Update HUD each frame (for animations, etc.)
   */
  public update(): void {
    // Can add dynamic updates here if needed
  }

  /**
   * Clean up HUD resources
   */
  public dispose(): void {
    this.advancedTexture.dispose();
  }
}

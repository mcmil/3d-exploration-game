import { AdvancedDynamicTexture, TextBlock, Rectangle, Control, Button, Ellipse } from '@babylonjs/gui';
import { Scene, Vector3 } from '@babylonjs/core';

export class HUD {
  private advancedTexture: AdvancedDynamicTexture;
  private scene: Scene;

  // UI Elements
  private objectiveText: TextBlock;
  private questCounter: TextBlock;
  private interactionPrompt: Rectangle;
  private interactionButton: Button;

  // Minimap
  private minimapContainer: Rectangle;
  private playerDot: Ellipse;
  private questDots: Map<string, Ellipse> = new Map();
  private readonly worldSize: number = 100; // Match world boundaries
  private readonly minimapSize: number = 150;

  constructor(scene: Scene) {
    this.scene = scene;

    // Create fullscreen UI texture with pointer blocking enabled
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
    this.advancedTexture.renderAtIdealSize = true;

    // Initialize UI elements
    this.objectiveText = this.createObjectiveText();
    this.questCounter = this.createQuestCounter();
    this.interactionPrompt = this.createInteractionPrompt();
    this.interactionButton = this.createInteractionButton();

    // Create minimap
    const minimap = this.createMinimap();
    this.minimapContainer = minimap.container;
    this.playerDot = minimap.playerDot;

    console.log('📊 HUD initialized!');
  }

  /**
   * Create objective text at bottom of screen
   */
  private createObjectiveText(): TextBlock {
    const text = new TextBlock('objectiveText');
    text.text = 'Walk to houses with colored markers above them';
    text.color = 'white';
    text.fontSize = 16;
    text.fontWeight = 'bold';
    text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    text.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    text.top = '-240px'; // Well above interaction prompt to avoid covering player
    text.height = '30px';
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
    promptBg.width = '280px';
    promptBg.height = '50px';
    promptBg.cornerRadius = 10;
    promptBg.color = 'white';
    promptBg.thickness = 2;
    promptBg.background = 'rgba(0, 0, 0, 0.75)';
    promptBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    promptBg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    promptBg.top = '-110px'; // Above the button
    promptBg.isVisible = false; // Hidden by default

    const promptText = new TextBlock('interactionPromptText');
    promptText.text = 'Tap the button below';
    promptText.color = 'white';
    promptText.fontSize = 16;
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
    button.width = '220px';
    button.height = '70px';
    button.color = 'white';
    button.background = '#00AA00'; // Green
    button.fontSize = 22;
    button.fontWeight = 'bold';
    button.cornerRadius = 12;
    button.thickness = 4;
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER; // Center to avoid joystick overlap
    button.top = '-30px';
    button.isVisible = false; // Hidden by default
    button.shadowColor = 'black';
    button.shadowBlur = 10;
    button.zIndex = 1000; // Ensure it's above joysticks

    // Enable pointer events to work above joysticks
    button.isPointerBlocker = true;

    // Visual feedback on touch
    button.onPointerDownObservable.add(() => {
      button.background = '#008800';
      console.log('🔘 Button pressed!');
    });

    button.onPointerUpObservable.add(() => {
      button.background = '#00AA00';
      console.log('🔘 Button released!');
    });

    // Hover effects (for desktop)
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
    // Only show button, not the prompt background (to avoid "two buttons" look)
    this.interactionPrompt.isVisible = false; // Hide the black box
    this.interactionButton.isVisible = true;

    // Update button text based on quest type
    const questNames: { [key: string]: string } = {
      power_outage: 'FIX POWER',
      satellite_tv: 'FIX SATELLITE',
      device_repair: 'REPAIR DEVICE',
      memory_clear: 'CLEAR MEMORY'
    };

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
   * Create minimap in top right corner
   */
  private createMinimap(): { container: Rectangle; playerDot: Ellipse } {
    // Minimap background
    const container = new Rectangle('minimapContainer');
    container.width = `${this.minimapSize}px`;
    container.height = `${this.minimapSize}px`;
    container.cornerRadius = 10;
    container.color = 'white';
    container.thickness = 3;
    container.background = 'rgba(0, 0, 0, 0.6)';
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    container.top = '70px'; // Below quest counter
    container.left = '-20px';
    this.advancedTexture.addControl(container);

    // Minimap title
    const title = new TextBlock('minimapTitle');
    title.text = 'MAP';
    title.color = 'white';
    title.fontSize = 12;
    title.fontWeight = 'bold';
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    title.top = '5px';
    title.height = '15px';
    container.addControl(title);

    // Player dot (green)
    const playerDot = new Ellipse('playerDot');
    playerDot.width = '8px';
    playerDot.height = '8px';
    playerDot.color = 'white';
    playerDot.thickness = 2;
    playerDot.background = '#00FF00'; // Bright green
    container.addControl(playerDot);

    return { container, playerDot };
  }

  /**
   * Add quest marker to minimap
   */
  public addQuestToMinimap(questId: string, position: Vector3, color: string): void {
    if (this.questDots.has(questId)) return;

    const dot = new Ellipse(`questDot_${questId}`);
    dot.width = '12px';
    dot.height = '12px';
    dot.color = 'white';
    dot.thickness = 2;
    dot.background = color;

    // Convert world position to minimap position
    // World: -100 to +100, Minimap: -60 to +60 (centered)
    const minimapX = (position.x / this.worldSize) * (this.minimapSize * 0.4);
    const minimapZ = -(position.z / this.worldSize) * (this.minimapSize * 0.4); // Negate Z for correct orientation

    dot.left = `${minimapX}px`;
    dot.top = `${minimapZ + 15}px`; // Offset for title

    this.minimapContainer.addControl(dot);
    this.questDots.set(questId, dot);
  }

  /**
   * Remove quest marker from minimap
   */
  public removeQuestFromMinimap(questId: string): void {
    const dot = this.questDots.get(questId);
    if (dot) {
      this.minimapContainer.removeControl(dot);
      this.questDots.delete(questId);
    }
  }

  /**
   * Update player position on minimap
   */
  public updateMinimapPlayerPosition(position: Vector3): void {
    // Convert world position to minimap position
    // World: -100 to +100, Minimap: -60 to +60 (centered)
    const minimapX = (position.x / this.worldSize) * (this.minimapSize * 0.4);
    const minimapZ = -(position.z / this.worldSize) * (this.minimapSize * 0.4); // Negate Z for correct orientation

    this.playerDot.left = `${minimapX}px`;
    this.playerDot.top = `${minimapZ + 15}px`; // Offset for title
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

import { GameEngine } from './game/GameEngine';

class App {
  private gameEngine: GameEngine | null = null;
  private loadingScreen: HTMLElement;
  private startButton: HTMLElement;
  private loadingText: HTMLElement;

  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen')!;
    this.startButton = document.getElementById('startButton')!;
    this.loadingText = document.querySelector('.loading-text')!;

    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Wait a moment to show loading screen
      await this.sleep(1000);

      // Get canvas
      const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
      if (!canvas) {
        throw new Error('Canvas not found!');
      }

      // Create game engine
      this.updateLoadingText('Initializing 3D engine...');
      this.gameEngine = new GameEngine(canvas);

      this.updateLoadingText('Creating world...');
      await this.gameEngine.initialize();

      // Show start button (required for audio context on mobile)
      this.showStartButton();

    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.updateLoadingText('Error loading game. Please refresh.');
    }
  }

  private showStartButton(): void {
    this.loadingText.style.display = 'none';
    this.startButton.style.display = 'block';

    this.startButton.addEventListener('click', () => {
      this.startGame();
    });
  }

  private startGame(): void {
    // Hide loading screen
    this.loadingScreen.classList.add('hidden');

    // Remove loading screen after transition
    setTimeout(() => {
      this.loadingScreen.style.display = 'none';
    }, 500);

    console.log('🎮 Game started! Use touch to rotate camera, pinch to zoom');
  }

  private updateLoadingText(text: string): void {
    this.loadingText.textContent = text;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}

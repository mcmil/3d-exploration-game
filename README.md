# 🎮 3D Exploration Game

A mobile-first 3D browser game built with Babylon.js, TypeScript, and Vite.

## 🚀 Live Demo

The game is automatically deployed to GitHub Pages on every push!

**URL**: `https://[your-username].github.io/3d-exploration-game/`

## ✨ Features

- **Mobile-First Design**: Optimized for touch controls and mobile performance
- **3D Environment**: Explore a colorful 3D world with interactive objects
- **Touch Controls**:
  - Swipe to rotate camera
  - Pinch to zoom in/out
  - Smooth, responsive camera movement
- **Performance Optimized**: Automatic quality adjustment based on device capabilities
- **Progressive Web App**: Install to home screen on mobile devices

## 🛠️ Tech Stack

- **Babylon.js 7.x** - Powerful 3D engine with excellent mobile support
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool with HMR
- **GitHub Actions** - Automated deployment

## 📱 Mobile Controls

- **One Finger Swipe**: Rotate camera around the scene
- **Pinch Gesture**: Zoom in/out
- **Two Finger Pan**: Pan camera (move target point)

## 🏗️ Project Structure

```
src/
├── game/
│   ├── GameEngine.ts      # Main engine initialization
│   └── SceneManager.ts    # Scene creation and management
├── main.ts                # Entry point
└── ...
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🚢 Deployment

### Automatic Deployment (GitHub Actions)

The project is configured to automatically deploy to GitHub Pages when you push to the `main` or `claude/3d-mobile-game-plan-eaadJ` branch.

**Setup Steps:**

1. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: "GitHub Actions"

2. Push your code:
   ```bash
   git add .
   git commit -m "Deploy game"
   git push -u origin claude/3d-mobile-game-plan-eaadJ
   ```

3. Wait for the GitHub Action to complete (check the Actions tab)

4. Visit your game at: `https://[username].github.io/3d-exploration-game/`

### Manual Deployment

You can also deploy manually to any static hosting service:

```bash
npm run build
# Upload the 'dist' folder to your hosting provider
```

## 🎯 Next Steps

This is a basic starter template. Here are some ideas to expand the game:

### Immediate Enhancements:
- [ ] Add virtual joystick for movement
- [ ] Implement player character with physics
- [ ] Add collision detection and interaction
- [ ] Create more detailed environment

### Advanced Features:
- [ ] Add sound effects and music
- [ ] Implement inventory system
- [ ] Create objectives/missions
- [ ] Add particle effects
- [ ] Implement save/load system
- [ ] Add multiplayer support

### Performance:
- [ ] Implement LOD (Level of Detail) system
- [ ] Add texture compression (KTX2)
- [ ] Optimize shadow rendering
- [ ] Implement object pooling

## 📚 Resources

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Babylon.js Playground](https://playground.babylonjs.com/)
- [Babylon.js Forum](https://forum.babylonjs.com/)

## 🐛 Troubleshooting

### Game won't load on mobile
- Check browser console for errors
- Ensure WebGL is supported (most modern browsers)
- Try clearing browser cache

### Performance issues
- The SceneOptimizer automatically adjusts quality
- Check device specifications
- Reduce number of objects in scene

### Touch controls not working
- Ensure browser permissions for touch events
- Try in a different browser (Chrome, Safari)
- Check that `touch-action: none` is applied to canvas

## 📝 License

MIT

## 🤝 Contributing

Feel free to open issues or submit pull requests!

---

Built with ❤️ using Babylon.js and developed entirely through Claude Code on mobile!

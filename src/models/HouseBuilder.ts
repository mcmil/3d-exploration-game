import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  DynamicTexture,
} from '@babylonjs/core';

export interface HouseConfig {
  position: Vector3;
  size: 'small' | 'medium' | 'large';
  roofColor?: Color3;
  wallColor?: Color3;
  hasSatelliteDish?: boolean;
  hasChristmasLights?: boolean;
  hasGraffiti?: boolean;
  hasPaprykarzGraffiti?: boolean;
}

export class HouseBuilder {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public createHouse(config: HouseConfig): Mesh {
    const parent = new Mesh('house', this.scene);
    parent.position = config.position;

    // Determine dimensions based on size
    let width = 4, height = 3, depth = 4;
    let roofColor = new Color3(0.8, 0.2, 0.2); // Red

    switch (config.size) {
      case 'small':
        width = 4; height = 3; depth = 4;
        roofColor = config.roofColor || new Color3(0.8, 0.2, 0.2); // Red
        break;
      case 'medium':
        width = 6; height = 4; depth = 5;
        roofColor = config.roofColor || new Color3(0.9, 0.5, 0.2); // Orange
        break;
      case 'large':
        width = 8; height = 4; depth = 6;
        roofColor = config.roofColor || new Color3(0.9, 0.8, 0.2); // Yellow
        break;
    }

    // Create main house body
    const walls = MeshBuilder.CreateBox(
      'walls',
      { width, height, depth },
      this.scene
    );
    walls.position.y = height / 2;
    walls.parent = parent;

    // Wall material (light color for snow reflection)
    const wallMaterial = new StandardMaterial('wallMat', this.scene);
    wallMaterial.diffuseColor = config.wallColor || new Color3(0.95, 0.95, 0.85);
    wallMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    walls.material = wallMaterial;
    walls.checkCollisions = true;

    // Create roof (pyramid)
    const roof = MeshBuilder.CreateCylinder(
      'roof',
      {
        diameterTop: 0,
        diameterBottom: Math.sqrt(width * width + depth * depth) + 0.5,
        height: height * 0.6,
        tessellation: 4,
      },
      this.scene
    );
    roof.position.y = height + (height * 0.3);
    roof.rotation.y = Math.PI / 4;
    roof.parent = parent;

    const roofMaterial = new StandardMaterial('roofMat', this.scene);
    roofMaterial.diffuseColor = roofColor;
    roofMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    roof.material = roofMaterial;

    // Add snow on roof (white tip)
    const roofSnow = MeshBuilder.CreateCylinder(
      'roofSnow',
      {
        diameterTop: 0.2,
        diameterBottom: Math.sqrt(width * width + depth * depth) + 0.6,
        height: height * 0.6 + 0.1,
        tessellation: 4,
      },
      this.scene
    );
    roofSnow.position.y = height + (height * 0.3);
    roofSnow.rotation.y = Math.PI / 4;
    roofSnow.parent = parent;

    const snowMaterial = new StandardMaterial('snowMat', this.scene);
    snowMaterial.diffuseColor = new Color3(1, 1, 1);
    snowMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
    roofSnow.material = snowMaterial;

    // Add chimney
    const chimney = MeshBuilder.CreateCylinder(
      'chimney',
      { diameter: 0.4, height: 1.5 },
      this.scene
    );
    chimney.position.set(width * 0.25, height + 0.75, 0);
    chimney.parent = parent;

    const chimneyMat = new StandardMaterial('chimneyMat', this.scene);
    chimneyMat.diffuseColor = new Color3(0.4, 0.2, 0.1);
    chimney.material = chimneyMat;

    // Add windows and door
    this.addWindows(parent, width, height, depth);
    this.addDoor(parent, width, height, depth);

    // Add satellite dish if specified
    if (config.hasSatelliteDish) {
      this.addSatelliteDish(parent, width, height, depth);
    }

    // Add Christmas lights if specified
    if (config.hasChristmasLights) {
      this.addChristmasLights(parent, width, height, depth);
    }

    // Add graffiti if specified
    if (config.hasGraffiti) {
      this.addGraffiti(parent, width, height, depth);
    }

    // Add paprykarz graffiti if specified
    if (config.hasPaprykarzGraffiti) {
      this.addPaprykarzGraffiti(parent, width, height, depth);
    }

    return parent;
  }

  private addWindows(parent: Mesh, width: number, height: number, depth: number): void {
    const windowMat = new StandardMaterial('windowMat', this.scene);
    windowMat.diffuseColor = new Color3(1, 1, 0.5); // Bright warm glow
    windowMat.emissiveColor = new Color3(0.8, 0.8, 0.3); // Very strong glow
    windowMat.backFaceCulling = false; // Visible from both sides

    // Front windows - using boxes for better visibility
    const frontWindow1 = MeshBuilder.CreateBox(
      'window',
      { width: 1.2, height: 1.4, depth: 0.1 },
      this.scene
    );
    frontWindow1.position.set(-width * 0.25, height * 0.4, depth / 2 + 0.1);
    frontWindow1.parent = parent;
    frontWindow1.material = windowMat;

    const frontWindow2 = MeshBuilder.CreateBox(
      'window',
      { width: 1.2, height: 1.4, depth: 0.1 },
      this.scene
    );
    frontWindow2.position.set(width * 0.25, height * 0.4, depth / 2 + 0.1);
    frontWindow2.parent = parent;
    frontWindow2.material = windowMat;
  }

  private addDoor(parent: Mesh, _width: number, height: number, depth: number): void {
    // Door on front wall
    const door = MeshBuilder.CreateBox(
      'door',
      { width: 0.9, height: 1.6, depth: 0.1 },
      this.scene
    );
    door.position.set(0, height * 0.27, depth / 2 + 0.06);
    door.parent = parent;

    const doorMat = new StandardMaterial('doorMat', this.scene);
    doorMat.diffuseColor = new Color3(0.4, 0.25, 0.15); // Brown wood
    door.material = doorMat;

    // Door handle
    const handle = MeshBuilder.CreateSphere(
      'handle',
      { diameter: 0.08 },
      this.scene
    );
    handle.position.set(0.3, height * 0.27, depth / 2 + 0.12);
    handle.parent = parent;

    const handleMat = new StandardMaterial('handleMat', this.scene);
    handleMat.diffuseColor = new Color3(0.8, 0.7, 0.3); // Gold/brass
    handle.material = handleMat;
  }

  private addSatelliteDish(parent: Mesh, width: number, height: number, depth: number): void {
    // Dish base (pole)
    const pole = MeshBuilder.CreateCylinder(
      'dishPole',
      { diameter: 0.1, height: 1 },
      this.scene
    );
    pole.position.set(width * 0.4, height + 0.5, depth * 0.3);
    pole.parent = parent;

    const poleMat = new StandardMaterial('poleMat', this.scene);
    poleMat.diffuseColor = new Color3(0.3, 0.3, 0.3);
    pole.material = poleMat;

    // Dish
    const dish = MeshBuilder.CreateSphere(
      'dish',
      { diameter: 0.8, slice: 0.5 },
      this.scene
    );
    dish.position.set(width * 0.4, height + 1, depth * 0.3);
    dish.rotation.x = Math.PI / 4;
    dish.parent = parent;

    const dishMat = new StandardMaterial('dishMat', this.scene);
    dishMat.diffuseColor = new Color3(0.9, 0.9, 0.9);
    dish.material = dishMat;

    // Label "Cyfrowy Polsat"
    const label = MeshBuilder.CreatePlane(
      'polsatLabel',
      { width: 0.6, height: 0.2 },
      this.scene
    );
    label.position.set(width * 0.4, height + 1, depth * 0.3 + 0.2);
    label.parent = parent;

    const labelMat = new StandardMaterial('labelMat', this.scene);
    labelMat.diffuseColor = new Color3(1, 0.7, 0); // Orange/gold
    label.material = labelMat;
  }

  private addChristmasLights(parent: Mesh, width: number, height: number, depth: number): void {
    const colors = [
      new Color3(1, 0, 0), // Red
      new Color3(0, 1, 0), // Green
      new Color3(0, 0, 1), // Blue
      new Color3(1, 1, 0), // Yellow
    ];

    // Add lights along roof edge
    const numLights = 8;
    for (let i = 0; i < numLights; i++) {
      const light = MeshBuilder.CreateSphere(
        'light',
        { diameter: 0.2 },
        this.scene
      );

      const angle = (i / numLights) * Math.PI * 2;
      const radius = Math.sqrt(width * width + depth * depth) / 2;
      light.position.set(
        Math.cos(angle) * radius * 0.8,
        height - 0.2,
        Math.sin(angle) * radius * 0.8
      );
      light.parent = parent;

      const lightMat = new StandardMaterial('lightMat', this.scene);
      lightMat.diffuseColor = colors[i % colors.length];
      lightMat.emissiveColor = colors[i % colors.length].scale(0.5);
      light.material = lightMat;
    }
  }

  private addGraffiti(parent: Mesh, width: number, height: number, _depth: number): void {
    // Create "POMORZANIN\nPANY" graffiti on side wall with actual text rendering
    const graffiti = MeshBuilder.CreatePlane(
      'graffiti',
      { width: width * 0.6, height: 0.6 },
      this.scene
    );
    graffiti.position.set(width / 2 + 0.02, height * 0.5, 0);
    graffiti.rotation.y = -Math.PI / 2;
    graffiti.parent = parent;

    // Create dynamic texture for text rendering
    const textureResolution = 512;
    const dynamicTexture = new DynamicTexture(
      'graffitiTexture',
      { width: textureResolution, height: textureResolution },
      this.scene,
      false
    );

    // Draw text using drawText method (smaller font, with line break)
    const font = 'bold 60px Arial';
    const textColor = '#FF3333'; // Red spray paint
    const backgroundColor = null; // Transparent

    dynamicTexture.drawText(
      'POMORZANIN\nPANY',
      null,
      null,
      font,
      textColor,
      backgroundColor,
      true,
      true
    );

    const graffitiMat = new StandardMaterial('graffitiMat', this.scene);
    graffitiMat.diffuseTexture = dynamicTexture;
    graffitiMat.emissiveColor = new Color3(0.3, 0, 0); // Slight glow
    graffitiMat.opacityTexture = dynamicTexture;
    graffiti.material = graffitiMat;
  }

  private addPaprykarzGraffiti(parent: Mesh, width: number, height: number, depth: number): void {
    // Create "PAPRYKARZ" graffiti on LEFT side wall with actual text rendering
    const graffiti = MeshBuilder.CreatePlane(
      'paprykarzGraffiti',
      { width: depth * 0.7, height: 0.5 },
      this.scene
    );
    graffiti.position.set(-width / 2 - 0.02, height * 0.6, 0);
    graffiti.rotation.y = Math.PI / 2; // Left side wall
    graffiti.parent = parent;

    // Create dynamic texture for text rendering
    const textureResolution = 512;
    const dynamicTexture = new DynamicTexture(
      'paprykarzGraffitiTexture',
      { width: textureResolution, height: textureResolution / 3 },
      this.scene,
      false
    );

    // Draw text using drawText method
    const font = 'bold 70px Arial';
    const textColor = '#FF8800'; // Orange spray paint (paprykarz color)
    const backgroundColor = null; // Transparent

    dynamicTexture.drawText(
      'PAPRYKARZ',
      null,
      null,
      font,
      textColor,
      backgroundColor,
      true,
      true
    );

    const graffitiMat = new StandardMaterial('paprykarzGraffitiMat', this.scene);
    graffitiMat.diffuseTexture = dynamicTexture;
    graffitiMat.emissiveColor = new Color3(0.3, 0.15, 0); // Orange glow
    graffitiMat.opacityTexture = dynamicTexture;
    graffiti.material = graffitiMat;
  }
}

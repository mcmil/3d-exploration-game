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
  hasCoatOfArms?: boolean;
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

    // Add windows (darker rectangles on walls)
    this.addWindows(parent, width, height, depth);

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

    // Add coat of arms if specified
    if (config.hasCoatOfArms) {
      this.addCoatOfArms(parent, width, height, depth);
    }

    return parent;
  }

  private addWindows(parent: Mesh, width: number, height: number, depth: number): void {
    const windowMat = new StandardMaterial('windowMat', this.scene);
    windowMat.diffuseColor = new Color3(0.8, 0.8, 0.3); // Warm glow
    windowMat.emissiveColor = new Color3(0.3, 0.3, 0.1); // Slight glow

    // Front windows
    const frontWindow1 = MeshBuilder.CreatePlane(
      'window',
      { width: 0.8, height: 1 },
      this.scene
    );
    frontWindow1.position.set(-width * 0.25, height * 0.4, depth / 2 + 0.01);
    frontWindow1.parent = parent;
    frontWindow1.material = windowMat;

    const frontWindow2 = MeshBuilder.CreatePlane(
      'window',
      { width: 0.8, height: 1 },
      this.scene
    );
    frontWindow2.position.set(width * 0.25, height * 0.4, depth / 2 + 0.01);
    frontWindow2.parent = parent;
    frontWindow2.material = windowMat;
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
    // Create "POMORZANIN PANY" graffiti on side wall with actual text rendering
    const graffiti = MeshBuilder.CreatePlane(
      'graffiti',
      { width: width * 0.8, height: 0.8 },
      this.scene
    );
    graffiti.position.set(width / 2 + 0.02, height * 0.5, 0);
    graffiti.rotation.y = -Math.PI / 2;
    graffiti.parent = parent;

    // Create dynamic texture for text rendering
    const textureResolution = 512;
    const dynamicTexture = new DynamicTexture(
      'graffitiTexture',
      { width: textureResolution, height: textureResolution / 4 },
      this.scene,
      false
    );

    // Draw text using drawText method
    const font = 'bold 80px Arial';
    const textColor = '#FF3333'; // Red spray paint
    const backgroundColor = null; // Transparent

    dynamicTexture.drawText(
      'POMORZANIN PANY',
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

  private addCoatOfArms(parent: Mesh, _width: number, height: number, depth: number): void {
    // Create authentic Nowogard coat of arms on front wall
    const shieldBase = MeshBuilder.CreatePlane(
      'coatOfArmsBase',
      { width: 1.4, height: 1.8 },
      this.scene
    );
    shieldBase.position.set(0, height * 0.6, depth / 2 + 0.02);
    shieldBase.parent = parent;

    // White/silver background
    const baseMat = new StandardMaterial('coaBaseMat', this.scene);
    baseMat.diffuseColor = new Color3(0.95, 0.95, 0.95); // White/silver
    shieldBase.material = baseMat;

    // Blue square in top left with griffin
    const blueSquare = MeshBuilder.CreatePlane(
      'blueSquare',
      { width: 0.6, height: 0.7 },
      this.scene
    );
    blueSquare.position.set(-0.3, height * 0.6 + 0.45, depth / 2 + 0.03);
    blueSquare.parent = parent;

    const blueMat = new StandardMaterial('blueMat', this.scene);
    blueMat.diffuseColor = new Color3(0.2, 0.4, 0.7); // Heraldic blue
    blueSquare.material = blueMat;

    // Yellow griffin on blue square
    const griffin = MeshBuilder.CreatePlane(
      'griffin',
      { width: 0.45, height: 0.55 },
      this.scene
    );
    griffin.position.set(-0.3, height * 0.6 + 0.45, depth / 2 + 0.04);
    griffin.parent = parent;

    const griffinMat = new StandardMaterial('griffinMat', this.scene);
    griffinMat.diffuseColor = new Color3(1, 0.9, 0.1); // Yellow/gold
    griffinMat.emissiveColor = new Color3(0.3, 0.27, 0);
    griffin.material = griffinMat;

    // Blue fleur-de-lis scattered on white background (simplified as circles)
    const fleurPositions = [
      [-0.5, 0.25], [0.15, 0.4], [0.45, 0.2],
      [-0.5, -0.1], [0.2, -0.05], [0.5, -0.2],
      [-0.35, -0.45], [0.25, -0.5]
    ];

    fleurPositions.forEach((pos) => {
      const fleur = MeshBuilder.CreatePlane(
        'fleur',
        { width: 0.15, height: 0.2 },
        this.scene
      );
      fleur.position.set(pos[0], height * 0.6 + pos[1], depth / 2 + 0.03);
      fleur.parent = parent;
      fleur.material = blueMat;
    });

    // Red brick gate at bottom
    const gate = MeshBuilder.CreatePlane(
      'gate',
      { width: 1.2, height: 0.65 },
      this.scene
    );
    gate.position.set(0, height * 0.6 - 0.57, depth / 2 + 0.03);
    gate.parent = parent;

    const gateMat = new StandardMaterial('gateMat', this.scene);
    gateMat.diffuseColor = new Color3(0.75, 0.15, 0.1); // Red brick
    gate.material = gateMat;

    // Gate tower (centered)
    const tower = MeshBuilder.CreatePlane(
      'tower',
      { width: 0.5, height: 0.55 },
      this.scene
    );
    tower.position.set(0, height * 0.6 - 0.52, depth / 2 + 0.04);
    tower.parent = parent;

    const towerMat = new StandardMaterial('towerMat', this.scene);
    towerMat.diffuseColor = new Color3(0.8, 0.2, 0.15); // Brighter red for tower
    tower.material = towerMat;

    // White archway on tower
    const arch = MeshBuilder.CreatePlane(
      'arch',
      { width: 0.3, height: 0.35 },
      this.scene
    );
    arch.position.set(0, height * 0.6 - 0.65, depth / 2 + 0.05);
    arch.parent = parent;

    const archMat = new StandardMaterial('archMat', this.scene);
    archMat.diffuseColor = new Color3(0.95, 0.95, 0.95); // White
    arch.material = archMat;
  }
}

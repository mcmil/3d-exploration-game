import {
  Scene,
  Vector3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from '@babylonjs/core';
import { HouseBuilder, HouseConfig } from '../models/HouseBuilder';
import { TreeBuilder } from '../models/TreeBuilder';

export interface WorldConfig {
  mapSize: number;
  numHouses: number;
  numTrees: number;
  numPowerPoles: number;
  numBoulders: number;
}

export class WorldGenerator {
  private scene: Scene;
  private houseBuilder: HouseBuilder;
  private treeBuilder: TreeBuilder;
  private houses: Mesh[] = [];
  private trees: Mesh[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
    this.houseBuilder = new HouseBuilder(scene);
    this.treeBuilder = new TreeBuilder(scene);
  }

  public generateWorld(config: WorldConfig): void {
    // Create snowy ground with texture
    this.createSnowGround(config.mapSize);

    // Generate houses in a grid with some randomness
    this.generateHouses(config.numHouses, config.mapSize);

    // Generate trees scattered around
    this.generateTrees(config.numTrees, config.mapSize);

    // Add central Christmas tree
    this.addCentralChristmasTree();

    // Add boulders for variety
    this.generateBoulders(config.numBoulders, config.mapSize);

    // Add roads (simple paths between houses)
    this.createRoads(config.mapSize);

    // Add power poles
    this.generatePowerPoles(config.numPowerPoles, config.mapSize);

    // Add detailed repair van at spawn point
    this.createRepairVan();

    // Add Polish regional themes
    this.addNowogardCitySign(config.mapSize);
    this.addBosmanBottles(config.mapSize);
    this.addPaprykarzAds(config.mapSize);
  }

  private createSnowGround(size: number): void {
    // Create ground with subdivisions for terrain detail
    const ground = MeshBuilder.CreateGround(
      'snowGround',
      { width: size, height: size, subdivisions: 120 },
      this.scene
    );

    const groundMat = new StandardMaterial('groundMat', this.scene);
    // Lighter snow with slight blue tint - still contrasts with white particles
    groundMat.diffuseColor = new Color3(0.88, 0.90, 0.94);
    groundMat.specularColor = new Color3(0.6, 0.6, 0.7);
    groundMat.specularPower = 48; // Moderately sharp for snow

    // Light ambient for bright snow
    groundMat.ambientColor = new Color3(0.8, 0.82, 0.88);

    ground.material = groundMat;
    ground.checkCollisions = true;
    ground.receiveShadows = true;

    // Create VERY dramatic snow drifts and hills
    const positions = ground.getVerticesData('position');
    if (positions) {
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];

        // Multi-layered noise for dramatic terrain variation
        const largeDrifts = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 4.0; // Doubled
        const mediumDrifts = Math.sin(x * 0.12) * Math.cos(z * 0.11) * 2.0; // Increased
        const smallBumps = Math.sin(x * 0.35) * Math.cos(z * 0.32) * 0.8;
        const ridges = Math.sin(x * 0.08 + z * 0.08) * 1.5; // Add ridges
        const random = (Math.sin(x * 1.1 + z * 0.9) + 1) * 0.4;

        const height = largeDrifts + mediumDrifts + smallBumps + ridges + random;
        positions[i + 1] = height; // y position
      }
      ground.updateVerticesData('position', positions);
      ground.createNormals(true);
    }
  }

  private generateHouses(numHouses: number, mapSize: number): void {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const gridSize = Math.ceil(Math.sqrt(numHouses));
    const spacing = (mapSize * 0.8) / gridSize;

    let houseCount = 0;

    for (let row = 0; row < gridSize && houseCount < numHouses; row++) {
      for (let col = 0; col < gridSize && houseCount < numHouses; col++) {
        const x = (col - gridSize / 2) * spacing + (Math.random() - 0.5) * spacing * 0.3;
        const z = (row - gridSize / 2) * spacing + (Math.random() - 0.5) * spacing * 0.3;

        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const hasDish = Math.random() > 0.5; // 50% chance
        const hasLights = Math.random() > 0.7; // 30% chance
        const hasGraffiti = Math.random() > 0.7; // 30% chance for graffiti
        const hasCoatOfArms = Math.random() > 0.8; // 20% chance for coat of arms

        const houseConfig: HouseConfig = {
          position: new Vector3(x, 0, z),
          size,
          hasSatelliteDish: hasDish,
          hasChristmasLights: hasLights,
          hasGraffiti: hasGraffiti,
          hasCoatOfArms: hasCoatOfArms,
        };

        const house = this.houseBuilder.createHouse(houseConfig);
        this.houses.push(house);
        houseCount++;
      }
    }
  }

  private generateTrees(numTrees: number, mapSize: number): void {
    for (let i = 0; i < numTrees; i++) {
      // Random position avoiding spawn point AND roads
      let x, z;
      let attempts = 0;
      do {
        x = (Math.random() - 0.5) * mapSize * 0.9;
        z = (Math.random() - 0.5) * mapSize * 0.9;
        attempts++;
        if (attempts > 100) break; // Prevent infinite loop
      } while (
        Math.sqrt(x * x + z * z) < 10 || // At least 10 units from spawn
        Math.abs(x) < 4 ||  // Not on vertical road (north-south along x=0)
        Math.abs(z) < 4     // Not on horizontal road (east-west along z=0)
      );

      const height = 4 + Math.random() * 3; // Random height 4-7
      const tree = this.treeBuilder.createPineTree(new Vector3(x, 0, z), height);
      this.trees.push(tree);
    }
  }

  private addCentralChristmasTree(): void {
    // Main Christmas tree in the center
    const christmasTree = this.treeBuilder.createChristmasTree(
      new Vector3(0, 0, 15), // Slightly offset from exact center
      8
    );
    this.trees.push(christmasTree);
  }

  private generateBoulders(numBoulders: number, mapSize: number): void {
    const boulderMat = new StandardMaterial('boulderMat', this.scene);
    boulderMat.diffuseColor = new Color3(0.5, 0.5, 0.6); // Gray stone
    boulderMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const snowMat = new StandardMaterial('boulderSnowMat', this.scene);
    snowMat.diffuseColor = new Color3(1, 1, 1);

    for (let i = 0; i < numBoulders; i++) {
      // Random position, avoiding center spawn
      let x, z;
      do {
        x = (Math.random() - 0.5) * mapSize * 0.85;
        z = (Math.random() - 0.5) * mapSize * 0.85;
      } while (Math.sqrt(x * x + z * z) < 15); // Keep away from spawn

      const size = 1 + Math.random() * 2; // Random size 1-3

      // Create irregular boulder (slightly squashed sphere)
      const boulder = MeshBuilder.CreateSphere(
        'boulder',
        {
          diameter: size,
          segments: 8, // Low poly for rocky look
        },
        this.scene
      );
      boulder.position.set(x, size * 0.3, z); // Partially buried
      boulder.scaling.y = 0.6 + Math.random() * 0.4; // Flatten slightly
      boulder.scaling.x = 0.8 + Math.random() * 0.4;
      boulder.scaling.z = 0.8 + Math.random() * 0.4;
      boulder.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      boulder.material = boulderMat;
      boulder.checkCollisions = true;

      // Add snow cap on top
      const snowCap = MeshBuilder.CreateSphere(
        'snowCap',
        { diameter: size * 0.6, segments: 8, slice: 0.6 },
        this.scene
      );
      snowCap.position.y = size * 0.4;
      snowCap.parent = boulder;
      snowCap.material = snowMat;
    }
  }

  private createRoads(mapSize: number): void {
    // Cross roads through the center - darker for visibility
    const roadWidth = 6; // Wider for better visibility
    const roadMat = new StandardMaterial('roadMat', this.scene);
    // Much darker gray for contrast with snow
    roadMat.diffuseColor = new Color3(0.4, 0.42, 0.45);
    roadMat.specularColor = new Color3(0.2, 0.2, 0.2);

    // Horizontal road (east-west)
    const roadH = MeshBuilder.CreateGround(
      'roadH',
      { width: mapSize, height: roadWidth },
      this.scene
    );
    roadH.position.y = 0.2; // Above ground bumps
    roadH.material = roadMat;

    // Vertical road (north-south)
    const roadV = MeshBuilder.CreateGround(
      'roadV',
      { width: roadWidth, height: mapSize },
      this.scene
    );
    roadV.position.y = 0.2;
    roadV.material = roadMat;

    // Add tire tracks for detail
    const trackMat = new StandardMaterial('trackMat', this.scene);
    trackMat.diffuseColor = new Color3(0.3, 0.32, 0.35);

    // Tire tracks on horizontal road
    [-1.5, 1.5].forEach((offset) => {
      const track = MeshBuilder.CreateGround(
        'track',
        { width: mapSize, height: 0.4 },
        this.scene
      );
      track.position.set(0, 0.21, offset);
      track.material = trackMat;
    });

    // Tire tracks on vertical road
    [-1.5, 1.5].forEach((offset) => {
      const track = MeshBuilder.CreateGround(
        'track',
        { width: 0.4, height: mapSize },
        this.scene
      );
      track.position.set(offset, 0.21, 0);
      track.material = trackMat;
    });
  }

  private generatePowerPoles(numPoles: number, mapSize: number): void {
    const poleMat = new StandardMaterial('poleMat', this.scene);
    poleMat.diffuseColor = new Color3(0.3, 0.2, 0.1); // Dark brown

    const lineMat = new StandardMaterial('lineMat', this.scene);
    lineMat.diffuseColor = new Color3(0.1, 0.1, 0.1); // Dark gray

    // Create poles along roads
    for (let i = 0; i < numPoles; i++) {
      const x = ((i % 2) - 0.5) * mapSize * 0.8;
      const z = (Math.floor(i / 2) - numPoles / 4) * (mapSize / (numPoles / 2));

      // Pole
      const pole = MeshBuilder.CreateCylinder(
        'powerPole',
        { diameter: 0.3, height: 6 },
        this.scene
      );
      pole.position.set(x, 3, z);
      pole.material = poleMat;

      // Cross beam
      const beam = MeshBuilder.CreateBox(
        'beam',
        { width: 2, height: 0.2, depth: 0.2 },
        this.scene
      );
      beam.position.set(x, 5.5, z);
      beam.material = poleMat;
    }
  }

  private createRepairVan(): void {
    const vanParent = new Mesh('repairVan', this.scene);
    vanParent.position.set(0, 0, -5);

    // Main van body
    const van = MeshBuilder.CreateBox(
      'vanBody',
      { width: 3, height: 2, depth: 4 },
      this.scene
    );
    van.position.y = 1;
    van.parent = vanParent;

    const vanMat = new StandardMaterial('vanMat', this.scene);
    vanMat.diffuseColor = new Color3(1, 0.5, 0); // Orange van
    vanMat.specularColor = new Color3(0.3, 0.3, 0.3);
    van.material = vanMat;

    // Van cab/roof
    const cab = MeshBuilder.CreateBox(
      'vanCab',
      { width: 2.8, height: 1.2, depth: 2 },
      this.scene
    );
    cab.position.set(0, 2.1, -0.5);
    cab.parent = vanParent;
    cab.material = vanMat;

    // Windshield
    const windshieldMat = new StandardMaterial('windshieldMat', this.scene);
    windshieldMat.diffuseColor = new Color3(0.6, 0.7, 0.8);
    windshieldMat.alpha = 0.6;

    const windshield = MeshBuilder.CreatePlane(
      'windshield',
      { width: 2.6, height: 1 },
      this.scene
    );
    windshield.position.set(0, 2.1, 0.51);
    windshield.rotation.x = -Math.PI / 12;
    windshield.parent = vanParent;
    windshield.material = windshieldMat;

    // Wheels with treads
    const wheelMat = new StandardMaterial('wheelMat', this.scene);
    wheelMat.diffuseColor = new Color3(0.1, 0.1, 0.1);

    const wheelPositions = [
      [-1.2, 0.4, -1.5],
      [1.2, 0.4, -1.5],
      [-1.2, 0.4, 1.3],
      [1.2, 0.4, 1.3],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = MeshBuilder.CreateCylinder(
        'wheel',
        { diameter: 0.8, height: 0.4 },
        this.scene
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.parent = vanParent;
      wheel.material = wheelMat;
    });

    // Headlights
    const headlightMat = new StandardMaterial('headlightMat', this.scene);
    headlightMat.diffuseColor = new Color3(1, 1, 0.8);
    headlightMat.emissiveColor = new Color3(0.5, 0.5, 0.4);

    [-0.8, 0.8].forEach((x) => {
      const headlight = MeshBuilder.CreateSphere(
        'headlight',
        { diameter: 0.3, segments: 8 },
        this.scene
      );
      headlight.position.set(x, 0.8, 2.01);
      headlight.scaling.z = 0.5;
      headlight.parent = vanParent;
      headlight.material = headlightMat;
    });

    // Emergency light bar on roof
    const lightBarBase = MeshBuilder.CreateBox(
      'lightBar',
      { width: 2, height: 0.2, depth: 0.5 },
      this.scene
    );
    lightBarBase.position.set(0, 2.8, -0.5);
    lightBarBase.parent = vanParent;

    const lightBarMat = new StandardMaterial('lightBarMat', this.scene);
    lightBarMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    lightBarBase.material = lightBarMat;

    // Red/blue emergency lights
    [-0.5, 0.5].forEach((x, i) => {
      const light = MeshBuilder.CreateSphere(
        'emergencyLight',
        { diameter: 0.25 },
        this.scene
      );
      light.position.set(x, 2.95, -0.5);
      light.parent = vanParent;

      const lightMat = new StandardMaterial('emergencyLightMat', this.scene);
      lightMat.diffuseColor = i === 0 ? new Color3(1, 0, 0) : new Color3(0, 0.3, 1);
      lightMat.emissiveColor = i === 0 ? new Color3(0.8, 0, 0) : new Color3(0, 0.2, 0.8);
      light.material = lightMat;
    });

    // Side label "NAPRAWA AWARYJNA"
    const label = MeshBuilder.CreatePlane(
      'vanLabel',
      { width: 2.5, height: 0.6 },
      this.scene
    );
    label.position.set(1.51, 1.5, 0);
    label.rotation.y = -Math.PI / 2;
    label.parent = vanParent;

    const labelMat = new StandardMaterial('labelMat', this.scene);
    labelMat.diffuseColor = new Color3(1, 1, 1);
    labelMat.emissiveColor = new Color3(0.3, 0.3, 0.3);
    label.material = labelMat;

    // Front bumper
    const bumper = MeshBuilder.CreateBox(
      'bumper',
      { width: 3.2, height: 0.3, depth: 0.3 },
      this.scene
    );
    bumper.position.set(0, 0.5, 2.15);
    bumper.parent = vanParent;

    const bumperMat = new StandardMaterial('bumperMat', this.scene);
    bumperMat.diffuseColor = new Color3(0.15, 0.15, 0.15);
    bumper.material = bumperMat;

    // Tool box on back
    const toolBox = MeshBuilder.CreateBox(
      'toolBox',
      { width: 2, height: 0.8, depth: 0.8 },
      this.scene
    );
    toolBox.position.set(0, 0.7, -2.4);
    toolBox.parent = vanParent;

    const toolBoxMat = new StandardMaterial('toolBoxMat', this.scene);
    toolBoxMat.diffuseColor = new Color3(0.6, 0.6, 0.6);
    toolBox.material = toolBoxMat;
  }

  private addNowogardCitySign(mapSize: number): void {
    // Create Polish green city limit sign
    const signParent = new Mesh('nowogardSign', this.scene);
    signParent.position.set(mapSize * 0.35, 0, mapSize * 0.35);

    // Sign post
    const post = MeshBuilder.CreateCylinder(
      'signPost',
      { diameter: 0.15, height: 3 },
      this.scene
    );
    post.position.y = 1.5;
    post.parent = signParent;

    const postMat = new StandardMaterial('signPostMat', this.scene);
    postMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
    post.material = postMat;

    // Green sign plate (Polish standard)
    const signPlate = MeshBuilder.CreateBox(
      'signPlate',
      { width: 3.5, height: 1.2, depth: 0.1 },
      this.scene
    );
    signPlate.position.y = 2.8;
    signPlate.parent = signParent;

    const signMat = new StandardMaterial('signMat', this.scene);
    signMat.diffuseColor = new Color3(0, 0.5, 0.1); // Polish green road sign
    signPlate.material = signMat;

    // White text area
    const textPlate = MeshBuilder.CreatePlane(
      'textPlate',
      { width: 3.2, height: 0.9 },
      this.scene
    );
    textPlate.position.set(0, 2.8, 0.06);
    textPlate.parent = signParent;

    const textMat = new StandardMaterial('textMat', this.scene);
    textMat.diffuseColor = new Color3(1, 1, 1);
    textPlate.material = textMat;

    // City name border (black line)
    const borderTop = MeshBuilder.CreatePlane(
      'border',
      { width: 3.0, height: 0.05 },
      this.scene
    );
    borderTop.position.set(0, 3.15, 0.07);
    borderTop.parent = signParent;

    const borderBot = MeshBuilder.CreatePlane(
      'border',
      { width: 3.0, height: 0.05 },
      this.scene
    );
    borderBot.position.set(0, 2.45, 0.07);
    borderBot.parent = signParent;

    const borderMat = new StandardMaterial('borderMat', this.scene);
    borderMat.diffuseColor = new Color3(0, 0, 0);
    borderTop.material = borderMat;
    borderBot.material = borderMat;
  }

  private addBosmanBottles(mapSize: number): void {
    // Add 5-8 Bosman beer bottles scattered around
    const numBottles = 5 + Math.floor(Math.random() * 4);

    const bottleMat = new StandardMaterial('bottleMat', this.scene);
    bottleMat.diffuseColor = new Color3(0.3, 0.15, 0.05); // Brown glass
    bottleMat.alpha = 0.7;
    bottleMat.specularColor = new Color3(0.5, 0.5, 0.5);

    const capMat = new StandardMaterial('capMat', this.scene);
    capMat.diffuseColor = new Color3(0.8, 0.6, 0.1); // Gold cap

    for (let i = 0; i < numBottles; i++) {
      const x = (Math.random() - 0.5) * mapSize * 0.6;
      const z = (Math.random() - 0.5) * mapSize * 0.6;

      // Bottle body
      const bottle = MeshBuilder.CreateCylinder(
        'bosmanBottle',
        { diameterTop: 0.15, diameterBottom: 0.2, height: 0.8 },
        this.scene
      );
      bottle.position.set(x, 0.1, z);
      bottle.rotation.set(
        Math.random() * Math.PI / 4,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI / 3
      );
      bottle.material = bottleMat;

      // Bottle cap
      const cap = MeshBuilder.CreateCylinder(
        'cap',
        { diameter: 0.16, height: 0.1 },
        this.scene
      );
      cap.position.y = 0.45;
      cap.parent = bottle;
      cap.material = capMat;

      // Label (red/white Bosman colors)
      const label = MeshBuilder.CreateCylinder(
        'label',
        { diameter: 0.21, height: 0.3 },
        this.scene
      );
      label.position.y = 0;
      label.parent = bottle;

      const labelMat = new StandardMaterial('labelMat', this.scene);
      labelMat.diffuseColor = new Color3(0.9, 0.1, 0.1); // Red label
      label.material = labelMat;
    }
  }

  private addPaprykarzAds(mapSize: number): void {
    // Add 2-3 Paprykarz Szczeciński billboards
    const positions = [
      new Vector3(-mapSize * 0.3, 0, -mapSize * 0.3),
      new Vector3(mapSize * 0.3, 0, -mapSize * 0.25),
      new Vector3(-mapSize * 0.25, 0, mapSize * 0.3),
    ];

    positions.forEach((pos) => {
      const billboard = new Mesh('paprykarzBillboard', this.scene);
      billboard.position = pos;

      // Support posts
      [-1, 1].forEach((side) => {
        const post = MeshBuilder.CreateCylinder(
          'billboardPost',
          { diameter: 0.2, height: 4 },
          this.scene
        );
        post.position.set(side * 1.5, 2, 0);
        post.parent = billboard;

        const postMat = new StandardMaterial('billboardPostMat', this.scene);
        postMat.diffuseColor = new Color3(0.3, 0.3, 0.3);
        post.material = postMat;
      });

      // Billboard plate
      const plate = MeshBuilder.CreateBox(
        'billboardPlate',
        { width: 3.5, height: 2, depth: 0.1 },
        this.scene
      );
      plate.position.y = 3;
      plate.parent = billboard;

      const plateMat = new StandardMaterial('billboardPlateMat', this.scene);
      plateMat.diffuseColor = new Color3(1, 0.95, 0.85); // Cream background
      plate.material = plateMat;

      // Paprykarz can graphic (orange/red)
      const canGraphic = MeshBuilder.CreateCylinder(
        'canGraphic',
        { diameter: 1.2, height: 0.15 },
        this.scene
      );
      canGraphic.position.set(0, 3.3, 0.06);
      canGraphic.rotation.x = Math.PI / 2;
      canGraphic.parent = billboard;

      const canMat = new StandardMaterial('canMat', this.scene);
      canMat.diffuseColor = new Color3(1, 0.4, 0.1); // Orange can
      canMat.emissiveColor = new Color3(0.3, 0.1, 0);
      canGraphic.material = canMat;

      // Red stripe (brand color)
      const stripe = MeshBuilder.CreateBox(
        'stripe',
        { width: 3.3, height: 0.4, depth: 0.12 },
        this.scene
      );
      stripe.position.set(0, 2.5, 0.06);
      stripe.parent = billboard;

      const stripeMat = new StandardMaterial('stripeMat', this.scene);
      stripeMat.diffuseColor = new Color3(0.9, 0.1, 0.1); // Red brand stripe
      stripe.material = stripeMat;
    });
  }

  public getHouses(): Mesh[] {
    return this.houses;
  }

  public getTrees(): Mesh[] {
    return this.trees;
  }
}

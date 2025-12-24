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
    // Create snowy ground
    this.createSnowGround(config.mapSize);

    // Generate houses in a grid with some randomness
    this.generateHouses(config.numHouses, config.mapSize);

    // Generate trees scattered around
    this.generateTrees(config.numTrees, config.mapSize);

    // Add central Christmas tree
    this.addCentralChristmasTree();

    // Add roads (simple paths between houses)
    this.createRoads(config.mapSize);

    // Add power poles
    this.generatePowerPoles(config.numPowerPoles, config.mapSize);

    // Add repair van at spawn point
    this.createRepairVan();
  }

  private createSnowGround(size: number): void {
    const ground = MeshBuilder.CreateGround(
      'snowGround',
      { width: size, height: size },
      this.scene
    );

    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.95, 0.95, 1.0); // Slightly blue-white snow
    groundMat.specularColor = new Color3(0.2, 0.2, 0.2); // Some shine
    ground.material = groundMat;
    ground.checkCollisions = true;
    ground.receiveShadows = true;
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

        const houseConfig: HouseConfig = {
          position: new Vector3(x, 0, z),
          size,
          hasSatelliteDish: hasDish,
          hasChristmasLights: hasLights,
        };

        const house = this.houseBuilder.createHouse(houseConfig);
        this.houses.push(house);
        houseCount++;
      }
    }
  }

  private generateTrees(numTrees: number, mapSize: number): void {
    for (let i = 0; i < numTrees; i++) {
      // Random position, but not too close to center (where player spawns)
      let x, z;
      do {
        x = (Math.random() - 0.5) * mapSize * 0.9;
        z = (Math.random() - 0.5) * mapSize * 0.9;
      } while (Math.sqrt(x * x + z * z) < 10); // At least 10 units from center

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

  private createRoads(mapSize: number): void {
    // Simple cross roads through the center
    const roadWidth = 4;
    const roadMat = new StandardMaterial('roadMat', this.scene);
    roadMat.diffuseColor = new Color3(0.7, 0.7, 0.75); // Light gray (snow-covered road)

    // Horizontal road
    const roadH = MeshBuilder.CreateGround(
      'roadH',
      { width: mapSize, height: roadWidth },
      this.scene
    );
    roadH.position.y = 0.01; // Slightly above ground to prevent z-fighting
    roadH.material = roadMat;

    // Vertical road
    const roadV = MeshBuilder.CreateGround(
      'roadV',
      { width: roadWidth, height: mapSize },
      this.scene
    );
    roadV.position.y = 0.01;
    roadV.material = roadMat;
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
    // Simple van at spawn point
    const van = MeshBuilder.CreateBox(
      'van',
      { width: 3, height: 2, depth: 4 },
      this.scene
    );
    van.position.set(0, 1, -5);

    const vanMat = new StandardMaterial('vanMat', this.scene);
    vanMat.diffuseColor = new Color3(1, 0.5, 0); // Orange van
    van.material = vanMat;

    // Van roof
    const roof = MeshBuilder.CreateBox(
      'vanRoof',
      { width: 2.8, height: 0.5, depth: 2 },
      this.scene
    );
    roof.position.set(0, 1.25, -5.5);
    roof.parent = van;
    roof.material = vanMat;

    // Wheels
    const wheelMat = new StandardMaterial('wheelMat', this.scene);
    wheelMat.diffuseColor = new Color3(0.1, 0.1, 0.1);

    const wheelPositions = [
      [-1, 0.3, -6.5],
      [1, 0.3, -6.5],
      [-1, 0.3, -3.5],
      [1, 0.3, -3.5],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = MeshBuilder.CreateCylinder(
        'wheel',
        { diameter: 0.8, height: 0.3 },
        this.scene
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.material = wheelMat;
    });

    // Label on side
    const label = MeshBuilder.CreatePlane(
      'vanLabel',
      { width: 2, height: 0.5 },
      this.scene
    );
    label.position.set(1.51, 1.5, -5);
    label.rotation.y = -Math.PI / 2;

    const labelMat = new StandardMaterial('labelMat', this.scene);
    labelMat.diffuseColor = new Color3(1, 1, 1);
    label.material = labelMat;
  }

  public getHouses(): Mesh[] {
    return this.houses;
  }

  public getTrees(): Mesh[] {
    return this.trees;
  }
}

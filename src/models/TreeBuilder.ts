import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
} from '@babylonjs/core';

export class TreeBuilder {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public createPineTree(position: Vector3, height: number = 5): Mesh {
    const parent = new Mesh('pineTree', this.scene);
    parent.position = position;

    // Trunk
    const trunk = MeshBuilder.CreateCylinder(
      'trunk',
      {
        diameter: 0.4,
        height: height * 0.4,
      },
      this.scene
    );
    trunk.position.y = height * 0.2;
    trunk.parent = parent;

    const trunkMat = new StandardMaterial('trunkMat', this.scene);
    trunkMat.diffuseColor = new Color3(0.3, 0.2, 0.1); // Brown
    trunk.material = trunkMat;
    trunk.checkCollisions = true;

    // Create 3 layers of branches (cones)
    const branchColor = new Color3(0.1, 0.4, 0.1); // Dark green
    const snowColor = new Color3(1, 1, 1); // White

    for (let i = 0; i < 3; i++) {
      const layerHeight = height * 0.3;
      const layerY = height * 0.4 + (i * layerHeight * 0.5);
      const layerRadius = (3 - i) * 0.8;

      // Green branches
      const branches = MeshBuilder.CreateCylinder(
        'branches',
        {
          diameterTop: 0,
          diameterBottom: layerRadius,
          height: layerHeight,
        },
        this.scene
      );
      branches.position.y = layerY;
      branches.parent = parent;

      const branchMat = new StandardMaterial('branchMat', this.scene);
      branchMat.diffuseColor = branchColor;
      branchMat.specularColor = new Color3(0.1, 0.1, 0.1);
      branches.material = branchMat;

      // Snow on top of branches
      const snow = MeshBuilder.CreateCylinder(
        'snow',
        {
          diameterTop: 0.2,
          diameterBottom: layerRadius + 0.1,
          height: layerHeight * 0.3,
        },
        this.scene
      );
      snow.position.y = layerY + layerHeight * 0.4;
      snow.parent = parent;

      const snowMat = new StandardMaterial('snowMat', this.scene);
      snowMat.diffuseColor = snowColor;
      snowMat.specularColor = new Color3(0.3, 0.3, 0.3);
      snow.material = snowMat;
    }

    // Add star on top for special tree (Christmas tree)
    // This will be used for the tallest tree in the center

    return parent;
  }

  public createChristmasTree(position: Vector3, height: number = 7): Mesh {
    const tree = this.createPineTree(position, height);

    // Add star on top
    const star = this.createStar();
    star.position.y = height * 1.1;
    star.parent = tree;

    // Add some lights
    this.addTreeLights(tree, height);

    return tree;
  }

  private createStar(): Mesh {
    const star = MeshBuilder.CreatePolyhedron(
      'star',
      { type: 4, size: 0.4 },
      this.scene
    );

    const starMat = new StandardMaterial('starMat', this.scene);
    starMat.diffuseColor = new Color3(1, 0.8, 0); // Gold
    starMat.emissiveColor = new Color3(0.8, 0.6, 0);
    star.material = starMat;

    return star;
  }

  private addTreeLights(tree: Mesh, height: number): void {
    const colors = [
      new Color3(1, 0, 0), // Red
      new Color3(0, 0, 1), // Blue
      new Color3(1, 1, 0), // Yellow
    ];

    // Add random lights on the tree
    for (let i = 0; i < 12; i++) {
      const light = MeshBuilder.CreateSphere(
        'treeLight',
        { diameter: 0.15 },
        this.scene
      );

      const angle = (i / 12) * Math.PI * 2 + Math.random();
      const radius = 0.8 + Math.random() * 0.5;
      const y = height * 0.3 + Math.random() * height * 0.6;

      light.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      light.parent = tree;

      const lightMat = new StandardMaterial('treeLightMat', this.scene);
      lightMat.diffuseColor = colors[i % colors.length];
      lightMat.emissiveColor = colors[i % colors.length].scale(0.7);
      light.material = lightMat;
    }
  }
}

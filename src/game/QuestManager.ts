import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export type QuestType = 'power_outage' | 'satellite_tv' | 'device_repair' | 'memory_clear';

export interface Quest {
  id: string;
  houseId: string;
  houseMesh: Mesh;
  type: QuestType;
  position: Vector3;
  completed: boolean;
  marker: Mesh | null;
}

export class QuestManager {
  private scene: Scene;
  private activeQuests: Quest[] = [];
  private completedQuestCount: number = 0;
  private questIdCounter: number = 0;

  // Quest type colors
  private readonly questColors = {
    power_outage: new Color3(1.0, 0.2, 0.2), // Red
    satellite_tv: new Color3(0.2, 0.5, 1.0), // Blue
    device_repair: new Color3(1.0, 0.9, 0.2), // Yellow
    memory_clear: new Color3(0.8, 0.2, 1.0)  // Purple
  };

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Randomly assign quests to houses at game start
   */
  public assignRandomQuests(count: number = 5): void {
    const houses = this.scene.meshes.filter(mesh => mesh.name === 'house' && mesh instanceof Mesh) as Mesh[];

    if (houses.length === 0) {
      console.error('❌ No houses found in scene!');
      return;
    }

    // Shuffle houses and pick first N
    const shuffled = houses.sort(() => Math.random() - 0.5);
    const selectedHouses = shuffled.slice(0, Math.min(count, houses.length));

    // Quest types available
    const questTypes: QuestType[] = ['power_outage', 'satellite_tv', 'device_repair', 'memory_clear'];

    for (const house of selectedHouses) {
      const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
      const quest: Quest = {
        id: `quest_${this.questIdCounter++}`,
        houseId: house.id,
        houseMesh: house,
        type: randomType,
        position: house.position.clone(),
        completed: false,
        marker: null
      };

      this.activeQuests.push(quest);
      this.createQuestMarker(quest);

      console.log(`🎯 Assigned ${randomType} quest to house at (${house.position.x.toFixed(1)}, ${house.position.z.toFixed(1)})`);
    }

    console.log(`✅ Created ${this.activeQuests.length} quests!`);
  }

  /**
   * Create visual marker above house with quest
   */
  private createQuestMarker(quest: Quest): void {
    // Create floating marker sphere
    const marker = MeshBuilder.CreateSphere(`marker_${quest.id}`, {
      diameter: 1.2,
      segments: 12
    }, this.scene);

    // Set color based on quest type
    const markerMat = new StandardMaterial(`markerMat_${quest.id}`, this.scene);
    markerMat.emissiveColor = this.questColors[quest.type];
    markerMat.disableLighting = true;
    marker.material = markerMat;

    // Position above house
    marker.position = new Vector3(
      quest.position.x,
      quest.position.y + 7.5, // Higher than interaction indicator
      quest.position.z
    );

    // Store reference
    quest.marker = marker;

    // Animate marker (bobbing motion)
    this.scene.registerBeforeRender(() => {
      if (marker && !quest.completed) {
        marker.position.y = quest.position.y + 7.5 + Math.sin(Date.now() / 400) * 0.4;
        marker.rotation.y += 0.02; // Slow rotation
      }
    });
  }

  /**
   * Complete a quest by ID
   */
  public completeQuest(questId: string): boolean {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest || quest.completed) {
      return false;
    }

    quest.completed = true;
    this.completedQuestCount++;

    // Remove marker
    if (quest.marker) {
      quest.marker.dispose();
      quest.marker = null;
    }

    console.log(`✅ Completed ${quest.type} quest! (${this.completedQuestCount}/${this.activeQuests.length})`);

    // Check if all quests completed
    if (this.completedQuestCount === this.activeQuests.length) {
      console.log('🎉 All quests completed! Great job!');
    }

    return true;
  }

  /**
   * Get quest at specific house position (position-based matching)
   */
  public getQuestAtPosition(position: Vector3, threshold: number = 5.0): Quest | null {
    for (const quest of this.activeQuests) {
      if (quest.completed) continue;

      const dx = position.x - quest.position.x;
      const dz = position.z - quest.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < threshold) {
        return quest;
      }
    }
    return null;
  }

  /**
   * Get quest at specific house (legacy - uses position matching)
   */
  public getQuestAtHouse(houseMesh: Mesh): Quest | null {
    return this.getQuestAtPosition(houseMesh.position, 5.0);
  }

  /**
   * Get nearest active quest to player position
   */
  public getNearestQuest(playerPos: Vector3): (Quest & { distance: number }) | null {
    let nearest: (Quest & { distance: number }) | null = null;
    let nearestDistance = Infinity;

    for (const quest of this.activeQuests) {
      if (quest.completed) continue;

      const dx = playerPos.x - quest.position.x;
      const dz = playerPos.z - quest.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = { ...quest, distance };
      }
    }

    return nearest;
  }

  /**
   * Get all active (not completed) quests
   */
  public getActiveQuests(): Quest[] {
    return this.activeQuests.filter(q => !q.completed);
  }

  /**
   * Get quest progress (completed / total)
   */
  public getProgress(): { completed: number; total: number } {
    return {
      completed: this.completedQuestCount,
      total: this.activeQuests.length
    };
  }

  /**
   * Check if all quests are completed
   */
  public allQuestsCompleted(): boolean {
    return this.completedQuestCount === this.activeQuests.length && this.activeQuests.length > 0;
  }

  /**
   * Get quest type name for display
   */
  public getQuestTypeName(type: QuestType): string {
    const names = {
      power_outage: 'Awaria Prądu',
      satellite_tv: 'Problem z Anteną Satelitarną',
      device_repair: 'Naprawa Urządzenia',
      memory_clear: 'Czyszczenie Pamięci'
    };
    return names[type];
  }

  /**
   * Get quest color as CSS string
   */
  public getQuestColorString(type: QuestType): string {
    const color = this.questColors[type];
    return `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
  }

  /**
   * Get all active quests (for minimap initialization)
   */
  public getAllQuests(): Quest[] {
    return this.activeQuests;
  }

  /**
   * Clean up all markers
   */
  public dispose(): void {
    for (const quest of this.activeQuests) {
      if (quest.marker) {
        quest.marker.dispose();
        quest.marker = null;
      }
    }
    this.activeQuests = [];
  }
}

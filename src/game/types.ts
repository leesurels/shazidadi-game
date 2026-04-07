// ===== 傻子大帝 - Game Types =====

export enum TerrainType {
  GRASS = 'grass',
  WATER = 'water',
  DESERT = 'desert',
  FOREST = 'forest',
}

export enum BuildingType {
  ROAD = 'road',
  HOUSE = 'house',
  FARM = 'farm',
  WELL = 'well',
  WAREHOUSE = 'warehouse',
  MARKET = 'market',
  LUMBER_MILL = 'lumber_mill',
  QUARRY = 'quarry',
  POTTERY_WORKSHOP = 'pottery_workshop',
  TAX_OFFICE = 'tax_office',
  TEMPLE = 'temple',
  GARDEN = 'garden',
  GUARD_TOWER = 'guard_tower',
  FIRE_STATION = 'fire_station',
  BRIDGE = 'bridge',
  DEMOLISH = 'demolish',
}

export enum GameEventType {
  FIRE = 'fire',
  BARBARIAN = 'barbarian',
  PLAGUE = 'plague',
  EARTHQUAKE = 'earthquake',
  GOOD_HARVEST = 'good_harvest',
  GOLD_DISCOVERY = 'gold_discovery',
  IMMIGRANTS = 'immigrants',
}

export interface GameEvent {
  type: GameEventType;
  title: string;
  emoji: string;
  description: string;
  tickOccurred: number;
  severity: 'good' | 'bad' | 'neutral';
  remainingTicks?: number;
}

export interface GameNotification {
  id: string;
  event: GameEvent;
  timestamp: number;
  read: boolean;
}

export interface Resources {
  food: number;
  wood: number;
  stone: number;
  pottery: number;
  gold: number;
}

export interface BuildingCost {
  gold: number;
  wood: number;
  stone: number;
}

export interface BuildingDef {
  type: BuildingType;
  name: string;
  emoji: string;
  cost: BuildingCost;
  color: string;
  roofColor?: string;
  production?: Partial<Resources>;
  happinessBonus?: number;
  desirabilityBonus?: number;
  populationCapacity?: number;
  range?: number;
  needsNearby?: { type: BuildingType; range: number; resource?: string };
  workersNeeded?: number; // Workers required to operate
  storageBonus?: number; // Storage capacity bonus per building
}

export interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  building: BuildingType | null;
  desirability: number;
  happinessBonus: number;
  houseLevel: number; // 0-4, higher = better house
}

export interface GameState {
  // Map
  map: Tile[][];
  mapSize: number;

  // Resources
  resources: Resources;

  // Population
  population: number;
  maxPopulation: number;
  populationGrowthRate: number;

  // Workers
  workersNeeded: number; // Total workers needed by all buildings
  workersAvailable: number; // Idle workers (population - workers assigned)

  // Storage
  storageCapacity: number; // Current max storage (base + warehouses)

  // Happiness
  happiness: number;

  // Game control
  gameSpeed: number; // 0=pause, 1, 2, 3
  isRunning: boolean;
  selectedBuilding: BuildingType | null;
  isDemolishMode: boolean;

  // Camera
  cameraX: number;
  cameraY: number;
  zoom: number;

  // Victory
  currentRank: string;
  highestPopulation: number;

  // UI state
  showStartScreen: boolean;
  showStatsPanel: boolean;
  selectedTile: { x: number; y: number } | null;
  showBuildingInfo: boolean;
  showMarketTrade: boolean; // Show market trade panel
  victoryNotification: string | null;

  // Timing
  tickCount: number;
  lastTradeTick: number; // Cooldown for trading

  // Events & Notifications
  notifications: GameNotification[];
  activeEvents: GameEvent[];
  lastEventTick: number;

  // Pedestrians
  pedestrians: Pedestrian[];
}

export interface TradeOption {
  id: string;
  name: string;
  emoji: string;
  giveResource: keyof Resources;
  giveAmount: number;
  receiveResource: keyof Resources;
  receiveAmount: number;
}

export interface ProductionRates {
  food: number;
  wood: number;
  stone: number;
  pottery: number;
  gold: number;
  workersNeeded: number;
  workersAvailable: number;
  workerEfficiency: number; // 0-1, how well staffed the buildings are
}

export interface VictoryTier {
  name: string;
  population: number;
  emoji: string;
}

export interface Pedestrian {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
  isFirefighter: boolean;
}

export interface RenderState {
  highlightedTile: { x: number; y: number } | null;
  buildingRangePreview: { x: number; y: number; range: number } | null;
  demolishPreview: boolean;
  animationTime: number;
  pedestrians: Pedestrian[];
}

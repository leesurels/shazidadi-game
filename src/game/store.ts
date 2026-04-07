// ===== 傻子大帝 - Game Store (Zustand) =====
import { create } from 'zustand';
import { BuildingType, TerrainType, GameEventType, type GameState, type ProductionRates, type GameEvent, type GameNotification } from './types';
import {
  MAP_SIZE, TILE_WIDTH, TILE_HEIGHT,
  STARTING_RESOURCES, BUILDING_DEFS,
  VICTORY_TIERS, FOOD_PER_PERSON_PER_TICK,
  SAVE_KEY, DESIRABILITY_EFFECTS, MIN_ZOOM, MAX_ZOOM,
  EVENT_DEFS, HOUSE_LEVELS, MAX_PEDESTRIANS, FIRE_STATION_REDUCTION,
  BASE_STORAGE, WAREHOUSE_STORAGE_BONUS, GOLD_STORAGE_MULTIPLIER,
  TRADE_OPTIONS, TRADE_COOLDOWN,
} from './constants';
import { generateMap, findNearbyBuilding } from './mapGenerator';
import type { Tile, Pedestrian } from './types';

interface GameActions {
  // Game control
  startNewGame: () => void;
  loadGame: () => boolean;
  saveGame: () => void;
  setGameSpeed: (speed: number) => void;
  togglePause: () => void;

  // Building
  selectBuilding: (type: BuildingType | null) => void;
  placeBuilding: (x: number, y: number) => boolean;
  demolishBuilding: (x: number, y: number) => boolean;
  setSelectedTile: (tile: { x: number; y: number } | null) => void;

  // Camera
  setCamera: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;

  // UI
  setShowStartScreen: (show: boolean) => void;
  setShowStatsPanel: (show: boolean) => void;
  setShowBuildingInfo: (show: boolean) => void;
  setShowMarketTrade: (show: boolean) => void;
  setVictoryNotification: (msg: string | null) => void;
  toggleDemolishMode: () => void;

  // Trading
  executeTrade: (tradeId: string) => boolean;

  // Notifications
  dismissNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Game tick
  gameTick: () => void;

  // Computed
  getProductionRates: () => ProductionRates;
  getCurrentRank: () => string;
  getBuildingCounts: () => Record<string, number>;
}

type GameStore = GameState & GameActions;

function getDefaultState(): GameState {
  return {
    map: generateMap(),
    mapSize: MAP_SIZE,
    resources: { ...STARTING_RESOURCES },
    population: 0,
    maxPopulation: 0,
    populationGrowthRate: 0,
    workersNeeded: 0,
    workersAvailable: 0,
    storageCapacity: BASE_STORAGE,
    happiness: 50,
    gameSpeed: 1,
    isRunning: false,
    selectedBuilding: null,
    isDemolishMode: false,
    cameraX: 0,
    cameraY: 0,
    zoom: 1,
    currentRank: '小村长',
    highestPopulation: 0,
    showStartScreen: true,
    showStatsPanel: false,
    selectedTile: null,
    showBuildingInfo: false,
    victoryNotification: null,
    tickCount: 0,
    lastTradeTick: -100,
    showMarketTrade: false,
    notifications: [],
    activeEvents: [],
    lastEventTick: -100,
    pedestrians: [],
  };
}

let notificationIdCounter = 0;

// ===== Helper: Check if a tile has adjacent road access =====
function hasRoadAccess(map: Tile[][], x: number, y: number): boolean {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of dirs) {
    const tx = x + dx;
    const ty = y + dy;
    if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
      const b = map[ty][tx].building;
      if (b === BuildingType.ROAD || b === BuildingType.BRIDGE) return true;
    }
  }
  return false;
}

// ===== Helper: Check if a tile is covered by a fire station =====
function hasFireStationCoverage(map: Tile[][], x: number, y: number): boolean {
  return findNearbyBuilding(map, x, y, BuildingType.FIRE_STATION,
    BUILDING_DEFS[BuildingType.FIRE_STATION]?.range || 6);
}

// ===== Helper: Count guard towers in the city =====
function countBuildings(map: Tile[][], type: BuildingType): number {
  let count = 0;
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (map[y][x].building === type) count++;
    }
  }
  return count;
}

// ===== Helper: Calculate total workers needed =====
function calculateWorkersNeeded(map: Tile[][]): number {
  let total = 0;
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const building = map[y][x].building;
      if (!building) continue;
      const def = BUILDING_DEFS[building];
      if (def?.workersNeeded) total += def.workersNeeded;
    }
  }
  return total;
}

// ===== Helper: Calculate storage capacity =====
function calculateStorageCapacity(map: Tile[][]): number {
  const warehouseCount = countBuildings(map, BuildingType.WAREHOUSE);
  return BASE_STORAGE + warehouseCount * WAREHOUSE_STORAGE_BONUS;
}

// ===== Helper: Cap resources to storage capacity =====
function capResources(resources: { food: number; wood: number; stone: number; pottery: number; gold: number }, capacity: number) {
  const goldCap = capacity * GOLD_STORAGE_MULTIPLIER;
 resources.food = Math.min(resources.food, capacity);
  resources.wood = Math.min(resources.wood, capacity);
  resources.stone = Math.min(resources.stone, capacity);
  resources.pottery = Math.min(resources.pottery, capacity);
  resources.gold = Math.min(resources.gold, goldCap);
}

// ===== Helper: Calculate max population based on house levels =====
function calculateMaxPopulation(map: Tile[][]): number {
  let total = 0;
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (map[y][x].building === BuildingType.HOUSE) {
        const level = map[y][x].houseLevel || 0;
        const lvl = HOUSE_LEVELS[Math.min(level, HOUSE_LEVELS.length - 1)];
        total += lvl.populationCapacity;
      }
    }
  }
  return total;
}

// ===== Helper: Recalculate desirability =====
function recalculateDesirability(map: Tile[][]): void {
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      map[y][x].desirability = 0;
    }
  }
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const building = map[y][x].building;
      if (!building) continue;
      const effect = DESIRABILITY_EFFECTS[building];
      if (effect === undefined) continue;
      const range = building === BuildingType.GARDEN ? 1 : 2;
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist <= range) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
              const falloff = building === BuildingType.GARDEN ? 1 : (1 - dist / (range + 1));
              map[ty][tx].desirability += Math.round(effect * falloff);
            }
          }
        }
      }
    }
  }
}

// ===== Helper: Collect all road/bridge tiles for pedestrian spawning =====
function collectRoadTiles(map: Tile[][]): { x: number; y: number }[] {
  const roads: { x: number; y: number }[] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const b = map[y][x].building;
      if (b === BuildingType.ROAD || b === BuildingType.BRIDGE) {
        roads.push({ x, y });
      }
    }
  }
  return roads;
}

// ===== Helper: Find a random adjacent road tile for a pedestrian =====
function findAdjacentRoad(map: Tile[][], x: number, y: number): { x: number; y: number } | null {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const options: { x: number; y: number }[] = [];
  for (const [dx, dy] of dirs) {
    const tx = x + dx;
    const ty = y + dy;
    if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
      const b = map[ty][tx].building;
      if (b === BuildingType.ROAD || b === BuildingType.BRIDGE) {
        options.push({ x: tx, y: ty });
      }
    }
  }
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)];
}

// ===== Helper: Update pedestrian positions each tick =====
function updatePedestrians(pedestrians: Pedestrian[], map: Tile[][]): Pedestrian[] {
  const roadTiles = collectRoadTiles(map);
  if (roadTiles.length === 0) return [];

  // Target count based on population (1 pedestrian per 15 pop, capped)
  const targetCount = Math.min(MAX_PEDESTRIANS, Math.floor(roadTiles.length / 3));
  const updated = [...pedestrians];

  // Move each pedestrian
  for (let i = updated.length - 1; i >= 0; i--) {
    const p = updated[i];
    p.progress += p.speed;
    if (p.progress >= 1) {
      // Arrived at target, pick a new adjacent road tile
      p.x = p.targetX;
      p.y = p.targetY;
      p.progress = 0;
      const next = findAdjacentRoad(map, p.x, p.y);
      if (next) {
        p.targetX = next.x;
        p.targetY = next.y;
      } else {
        // Stuck, remove
        updated.splice(i, 1);
      }
    }
  }

  // Spawn new pedestrians if needed
  while (updated.length < targetCount) {
    const road = roadTiles[Math.floor(Math.random() * roadTiles.length)];
    const next = findAdjacentRoad(map, road.x, road.y);
    if (!next) continue;

    const isFirefighter = Math.random() < 0.15;
    updated.push({
      x: road.x,
      y: road.y,
      targetX: next.x,
      targetY: next.y,
      progress: 0,
      speed: 0.15 + Math.random() * 0.15,
      color: isFirefighter ? '#CC3333' : ['#8B6914', '#654321', '#4a3520', '#2c1e10'][Math.floor(Math.random() * 4)],
      isFirefighter,
    });
  }

  // Remove excess
  while (updated.length > targetCount) {
    updated.pop();
  }

  return updated;
}

// ===== Helper: Upgrade houses based on happiness & desirability =====
function processHouseUpgrades(map: Tile[][], happiness: number): boolean {
  let changed = false;
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (map[y][x].building !== BuildingType.HOUSE) continue;

      const currentLevel = map[y][x].houseLevel || 0;
      if (currentLevel >= HOUSE_LEVELS.length - 1) continue;

      const nextLevel = HOUSE_LEVELS[currentLevel + 1];
      if (happiness >= nextLevel.happinessReq && map[y][x].desirability >= nextLevel.desirabilityReq) {
        // Upgrade chance: higher happiness = more likely (checked per tick)
        const upgradeChance = 0.05 + (happiness - nextLevel.happinessReq) * 0.005;
        if (Math.random() < upgradeChance) {
          map[y][x].houseLevel = currentLevel + 1;
          changed = true;
        }
      } else if (happiness < HOUSE_LEVELS[currentLevel].happinessReq - 15) {
        // Downgrade if happiness drops too low
        if (currentLevel > 0 && Math.random() < 0.08) {
          map[y][x].houseLevel = currentLevel - 1;
          changed = true;
        }
      }
    }
  }
  return changed;
}

// ===== Helper: Process a random event =====
function processRandomEvent(
  map: Tile[][],
  resources: { food: number; wood: number; stone: number; pottery: number; gold: number },
  population: number,
  tickCount: number
): {
  event: GameEvent;
  description: string;
  populationLoss?: number;
  populationGain?: number;
  resourceGain?: number;
} | null {
  let buildingCount = 0;
  const buildingPositions: { x: number; y: number }[] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (map[y][x].building) {
        buildingCount++;
        buildingPositions.push({ x, y });
      }
    }
  }

  const eligible = EVENT_DEFS.filter(e => {
    if (population < e.minPopulation) return false;
    if (buildingCount < e.minBuildings) return false;
    return true;
  });
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  let selected = eligible[0];
  for (const e of eligible) {
    roll -= e.weight;
    if (roll <= 0) {
      selected = e;
      break;
    }
  }

  const event: GameEvent = {
    type: selected.type,
    title: selected.title,
    emoji: selected.emoji,
    description: '',
    tickOccurred: tickCount,
    severity: selected.severity,
  };

  switch (selected.type) {
    case GameEventType.FIRE: {
      // Destroy 1-2 random non-bridge buildings, but fire station protected ones are safe
      let eligibleBuildings = buildingPositions.filter(p => {
        if (map[p.y][p.x].building === BuildingType.BRIDGE) return false;
        return true;
      });
      // Filter out fire-station-protected buildings
      const unprotected = eligibleBuildings.filter(p => !hasFireStationCoverage(map, p.x, p.y));
      if (unprotected.length === 0) {
        // All buildings protected - fire still might break through with reduced probability
        if (Math.random() > FIRE_STATION_REDUCTION) return null;
        // Use all buildings as targets but destroy fewer
        eligibleBuildings = eligibleBuildings;
      } else {
        // Use unprotected buildings, further reduce count if there are fire stations
        eligibleBuildings = unprotected;
      }
      if (eligibleBuildings.length === 0) return null;
      const count = Math.min(2, eligibleBuildings.length);
      const shuffled = [...eligibleBuildings].sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        const pos = shuffled[i];
        map[pos.y][pos.x].building = null;
        if (map[pos.y][pos.x].houseLevel !== undefined) map[pos.y][pos.x].houseLevel = 0;
      }
      const description = selected.descriptionTemplate.replace('{count}', String(count));
      event.description = description;
      return { event, description };
    }
    case GameEventType.BARBARIAN: {
      // Guard towers reduce barbarian damage by 50% per tower (capped at 80% reduction)
      const guardCount = countBuildings(map, BuildingType.GUARD_TOWER);
      const reductionFactor = Math.min(0.8, guardCount * 0.25);
      const baseLoss = Math.max(3, Math.floor(population * (0.05 + Math.random() * 0.1)));
      const loss = Math.max(1, Math.floor(baseLoss * (1 - reductionFactor)));
      const description = selected.descriptionTemplate.replace('{count}', String(loss)) +
        (guardCount > 0 ? `（警卫塔减少了${Math.floor(reductionFactor * 100)}%伤亡）` : '');
      event.description = description;
      return { event, description, populationLoss: loss };
    }
    case GameEventType.PLAGUE: {
      const loss = Math.max(3, Math.floor(population * (0.03 + Math.random() * 0.07)));
      const description = selected.descriptionTemplate.replace('{count}', String(loss));
      event.description = description;
      return { event, description, populationLoss: loss };
    }
    case GameEventType.EARTHQUAKE: {
      const eligibleBuildings = buildingPositions.filter(p => map[p.y][p.x].building !== BuildingType.BRIDGE);
      if (eligibleBuildings.length === 0) return null;
      const center = eligibleBuildings[Math.floor(Math.random() * eligibleBuildings.length)];
      const targets: { x: number; y: number }[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = center.x + dx;
          const ty = center.y + dy;
          if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
            if (map[ty][tx].building && map[ty][tx].building !== BuildingType.BRIDGE) {
              targets.push({ x: tx, y: ty });
            }
          }
        }
      }
      if (targets.length === 0) return null;
      const count = Math.min(2 + Math.floor(Math.random() * 3), targets.length);
      const shuffled = [...targets].sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        map[shuffled[i].y][shuffled[i].x].building = null;
        if (map[shuffled[i].y][shuffled[i].x].houseLevel !== undefined) map[shuffled[i].y][shuffled[i].x].houseLevel = 0;
      }
      const description = selected.descriptionTemplate.replace('{count}', String(count));
      event.description = description;
      return { event, description };
    }
    case GameEventType.GOOD_HARVEST: {
      const gain = 30 + Math.floor(Math.random() * 21);
      const description = selected.descriptionTemplate.replace('{count}', String(gain));
      event.description = description;
      return { event, description, resourceGain: gain };
    }
    case GameEventType.GOLD_DISCOVERY: {
      const gain = 50 + Math.floor(Math.random() * 51);
      const description = selected.descriptionTemplate.replace('{count}', String(gain));
      event.description = description;
      return { event, description, resourceGain: gain };
    }
    case GameEventType.IMMIGRANTS: {
      const gain = 5 + Math.floor(Math.random() * 6);
      const description = selected.descriptionTemplate.replace('{count}', String(gain));
      event.description = description;
      return { event, description, populationGain: gain };
    }
    default:
      return null;
  }
}

// ===== Buildings that don't require road access =====
const ROAD_EXEMPT_BUILDINGS = new Set([
  BuildingType.FARM,
  BuildingType.WELL,
  BuildingType.ROAD,
  BuildingType.BRIDGE,
  BuildingType.GARDEN,
]);

export const useGameStore = create<GameStore>((set, get) => ({
  ...getDefaultState(),

  startNewGame: () => {
    localStorage.removeItem(SAVE_KEY);
    const state = getDefaultState();
    state.showStartScreen = false;
    state.isRunning = true;
    const halfMapW = (MAP_SIZE * TILE_WIDTH) / 2;
    const halfMapH = (MAP_SIZE * TILE_HEIGHT) / 2;
    const startWorldX = 3 * TILE_WIDTH + TILE_WIDTH / 2 - halfMapW;
    const startWorldY = 3 * TILE_HEIGHT + TILE_HEIGHT / 2 - halfMapH;
    state.cameraX = -startWorldX;
    state.cameraY = -startWorldY;
    set(state);
  },

  loadGame: () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.mapSize !== MAP_SIZE) {
          localStorage.removeItem(SAVE_KEY);
          return false;
        }
        data.showStartScreen = false;
        data.showStatsPanel = false;
        data.showBuildingInfo = false;
        data.victoryNotification = null;
        data.isRunning = true;
        if (!data.notifications) data.notifications = [];
        if (!data.activeEvents) data.activeEvents = [];
        if (data.lastEventTick === undefined) data.lastEventTick = -100;
        if (!data.pedestrians) data.pedestrians = [];
        if (!data.workersNeeded) data.workersNeeded = 0;
        if (!data.workersAvailable) data.workersAvailable = 0;
        if (!data.storageCapacity) data.storageCapacity = BASE_STORAGE;
        if (!data.lastTradeTick) data.lastTradeTick = -100;
        if (data.showMarketTrade === undefined) data.showMarketTrade = false;
        // Ensure houseLevel exists on all tiles
        if (data.map) {
          for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
              if (data.map[y][x].houseLevel === undefined) {
                data.map[y][x].houseLevel = 0;
              }
            }
          }
        }
        set(data);
        return true;
      }
    } catch (e) {
      console.error('Failed to load game:', e);
    }
    return false;
  },

  saveGame: () => {
    try {
      const state = get();
      const saveData = {
        map: state.map,
        mapSize: state.mapSize,
        resources: state.resources,
        population: state.population,
        maxPopulation: state.maxPopulation,
        happiness: state.happiness,
        gameSpeed: state.gameSpeed,
        cameraX: state.cameraX,
        cameraY: state.cameraY,
        zoom: state.zoom,
        currentRank: state.currentRank,
        highestPopulation: state.highestPopulation,
        tickCount: state.tickCount,
        notifications: state.notifications,
        activeEvents: state.activeEvents,
        lastEventTick: state.lastEventTick,
        lastTradeTick: state.lastTradeTick,
        pedestrians: state.pedestrians,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  },

  setGameSpeed: (speed) => set({ gameSpeed: speed, isRunning: speed > 0 }),
  togglePause: () => {
    const { gameSpeed } = get();
    if (gameSpeed === 0) set({ gameSpeed: 1, isRunning: true });
    else set({ gameSpeed: 0, isRunning: false });
  },

  selectBuilding: (type) => set({
    selectedBuilding: type,
    isDemolishMode: false,
    showBuildingInfo: false,
  }),

  placeBuilding: (x, y) => {
    const state = get();
    const tile = state.map[y]?.[x];
    if (!tile) return false;

    const buildingType = state.selectedBuilding;
    if (!buildingType || buildingType === BuildingType.DEMOLISH) return false;

    const def = BUILDING_DEFS[buildingType];
    if (!def) return false;

    if (tile.terrain === TerrainType.WATER) {
      if (buildingType !== BuildingType.BRIDGE) return false;
    }
    if (tile.building !== null) return false;
    if (tile.terrain === TerrainType.FOREST) return false;

    const { resources } = state;
    if (resources.gold < def.cost.gold) return false;
    if (resources.wood < def.cost.wood) return false;
    if (resources.stone < def.cost.stone) return false;

    const newResources = { ...resources };
    newResources.gold -= def.cost.gold;
    newResources.wood -= def.cost.wood;
    newResources.stone -= def.cost.stone;

    const newMap = state.map.map((row: Tile[]) => row.map((t: Tile) => ({ ...t })));
    newMap[y][x].building = buildingType;
    if (buildingType === BuildingType.HOUSE) {
      newMap[y][x].houseLevel = 0;
    }

    recalculateDesirability(newMap);
    const maxPop = calculateMaxPopulation(newMap);

    set({
      map: newMap,
      resources: newResources,
      maxPopulation: maxPop,
    });

    return true;
  },

  demolishBuilding: (x, y) => {
    const state = get();
    const tile = state.map[y]?.[x];
    if (!tile || !tile.building) return false;

    const def = BUILDING_DEFS[tile.building];
    if (!def) return false;

    const newResources = { ...state.resources };
    newResources.gold += Math.floor(def.cost.gold * 0.5);
    newResources.wood += Math.floor(def.cost.wood * 0.5);
    newResources.stone += Math.floor(def.cost.stone * 0.5);

    const newMap = state.map.map((row: Tile[]) => row.map((t: Tile) => ({ ...t })));
    newMap[y][x].building = null;
    newMap[y][x].houseLevel = 0;

    recalculateDesirability(newMap);
    const maxPop = calculateMaxPopulation(newMap);

    set({
      map: newMap,
      resources: newResources,
      maxPopulation: maxPop,
      showBuildingInfo: false,
      selectedTile: null,
    });

    return true;
  },

  setSelectedTile: (tile) => set({ selectedTile: tile, showBuildingInfo: tile !== null }),
  setCamera: (x, y) => set({ cameraX: x, cameraY: y }),
  setZoom: (zoom) => set({ zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) }),

  setShowStartScreen: (show) => set({ showStartScreen: show }),
  setShowStatsPanel: (show) => set({ showStatsPanel: show }),
  setShowBuildingInfo: (show) => set({ showBuildingInfo: show }),
  setShowMarketTrade: (show) => set({ showMarketTrade: show }),
  setVictoryNotification: (msg) => set({ victoryNotification: msg }),

  toggleDemolishMode: () => {
    const { isDemolishMode } = get();
    set({
      isDemolishMode: !isDemolishMode,
      selectedBuilding: !isDemolishMode ? BuildingType.DEMOLISH : null,
    });
  },

  dismissNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [], activeEvents: [] });
  },

  executeTrade: (tradeId: string) => {
    const state = get();
    // Cooldown check
    if (state.tickCount - state.lastTradeTick < TRADE_COOLDOWN) return false;

    // Must have at least one market with road access
    let hasMarket = false;
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (state.map[y][x].building === BuildingType.MARKET && hasRoadAccess(state.map, x, y)) {
          hasMarket = true;
          break;
        }
      }
      if (hasMarket) break;
    }
    if (!hasMarket) return false;

    const trade = TRADE_OPTIONS.find(t => t.id === tradeId);
    if (!trade) return false;

    const newResources = { ...state.resources };
    const storageCap = calculateStorageCapacity(state.map);
    const goldCap = storageCap * GOLD_STORAGE_MULTIPLIER;

    // Check if player has enough resources
    if (newResources[trade.giveResource] < trade.giveAmount) return false;
    // Check if receiving would exceed storage
    const cap = trade.receiveResource === 'gold' ? goldCap : storageCap;
    if (newResources[trade.receiveResource] + trade.receiveAmount > cap) return false;

    newResources[trade.giveResource] -= trade.giveAmount;
    newResources[trade.receiveResource] += trade.receiveAmount;

    set({
      resources: newResources,
      lastTradeTick: state.tickCount,
    });
    return true;
  },

  gameTick: () => {
    const state = get();
    if (!state.isRunning || state.gameSpeed === 0) return;

    const newResources = { ...state.resources };

    const newMap = state.map.map((row: Tile[]) => row.map((t: Tile) => ({ ...t })));
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        newMap[y][x].happinessBonus = 0;
      }
    }

    // Calculate worker and storage stats
    const totalWorkersNeeded = calculateWorkersNeeded(newMap);
    const storageCap = calculateStorageCapacity(newMap);
    // Worker efficiency: 1.0 if fully staffed, <1 if understaffed
    const workerEfficiency = totalWorkersNeeded > 0
      ? Math.min(1, state.population / totalWorkersNeeded)
      : (state.population > 0 ? 1 : 0);

    // Process each building
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const tile = newMap[y][x];
        if (!tile.building) continue;

        const def = BUILDING_DEFS[tile.building];
        if (!def) continue;

        // Resource production (affected by worker efficiency)
        if (def.production) {
          let canProduce = true;

          // Check needs (well for farms, warehouse for pottery)
          if (def.needsNearby) {
            if (def.needsNearby.resource === 'well_water') {
              canProduce = findNearbyBuilding(newMap, x, y, BuildingType.WELL, def.needsNearby.range);
            } else if (def.needsNearby.type === BuildingType.WAREHOUSE) {
              canProduce = findNearbyBuilding(newMap, x, y, BuildingType.WAREHOUSE, def.needsNearby.range);
            }
          }

          // Road access check (farms and wells are exempt)
          if (canProduce && !ROAD_EXEMPT_BUILDINGS.has(tile.building)) {
            canProduce = hasRoadAccess(newMap, x, y);
          }

          // Worker check: production buildings need workers
          if (canProduce && (def.workersNeeded || 0) > 0) {
            canProduce = workerEfficiency > 0;
          }

          if (canProduce) {
            // Apply worker efficiency to production output
            const eff = (def.workersNeeded || 0) > 0 ? workerEfficiency : 1;
            if (tile.building === BuildingType.POTTERY_WORKSHOP) {
              if (newResources.stone >= 1) {
                newResources.pottery += (def.production.pottery || 0) * eff;
                newResources.stone -= 1 * eff;
              }
            } else {
              if (def.production.food) newResources.food += def.production.food * eff;
              if (def.production.wood) newResources.wood += def.production.wood * eff;
              if (def.production.stone) newResources.stone += def.production.stone * eff;
            }
          }
        }

        // Tax office - needs road access and workers
        if (tile.building === BuildingType.TAX_OFFICE && def.range) {
          if (hasRoadAccess(newMap, x, y) && workerEfficiency > 0) {
            let nearbyPop = 0;
            for (let dy = -def.range; dy <= def.range; dy++) {
              for (let dx = -def.range; dx <= def.range; dx++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist <= def.range) {
                  const tx = x + dx;
                  const ty = y + dy;
                  if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
                    if (newMap[ty][tx].building === BuildingType.HOUSE) {
                      const hLevel = newMap[ty][tx].houseLevel || 0;
                      const lvl = HOUSE_LEVELS[Math.min(hLevel, HOUSE_LEVELS.length - 1)];
                      nearbyPop += lvl.populationCapacity;
                    }
                  }
                }
              }
            }
            const popRatio = state.population > 0 ? Math.min(1, nearbyPop / Math.max(1, state.population)) : 0;
            const taxGold = Math.floor(5 * Math.ceil(state.population / 10) * popRatio * workerEfficiency);
            if (taxGold > 0) newResources.gold += taxGold;
          }
        }

        // Market - no longer auto-trades, trading is manual via UI

        // Happiness buildings affect nearby houses
        if ((def.happinessBonus || 0) > 0 && def.range) {
          for (let dy = -def.range; dy <= def.range; dy++) {
            for (let dx = -def.range; dx <= def.range; dx++) {
              const dist = Math.abs(dx) + Math.abs(dy);
              if (dist <= def.range) {
                const tx = x + dx;
                const ty = y + dy;
                if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
                  newMap[ty][tx].happinessBonus += def.happinessBonus || 0;
                }
              }
            }
          }
        }
      }
    }

    // Food consumption
    const foodConsumed = state.population * FOOD_PER_PERSON_PER_TICK;
    newResources.food -= foodConsumed;
    if (newResources.food < 0) newResources.food = 0;

    // Pottery consumption: population uses pottery, needs continuous production
    const potteryConsumption = state.population > 0 ? Math.max(1, Math.ceil(state.population / 60)) : 0;
    newResources.pottery -= potteryConsumption;
    if (newResources.pottery < 0) newResources.pottery = 0;

    // Apply storage capacity limits
    capResources(newResources, storageCap);

    // House upgrade processing (before population calc so maxPop is correct)
    const currentMaxPop = calculateMaxPopulation(newMap);
    processHouseUpgrades(newMap, state.happiness);
    const maxPop = calculateMaxPopulation(newMap);

    // Population growth
    let newPopulation = state.population;
    if (newResources.food > 20 && newPopulation < maxPop) {
      const growthRate = state.happiness / 100;
      const growth = Math.max(1, Math.floor(growthRate * 2));
      newPopulation = Math.min(maxPop, newPopulation + growth);
    } else if (newResources.food <= 0 && newPopulation > 0) {
      newPopulation = Math.max(0, newPopulation - 2);
    }

    // Calculate happiness
    let totalHappinessBonus = 0;
    let houseCount = 0;
    let hasPottery = newResources.pottery > 0;

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (newMap[y][x].building === BuildingType.HOUSE) {
          houseCount++;
          totalHappinessBonus += newMap[y][x].happinessBonus;
        }
      }
    }

    let happiness = 50;
    if (houseCount > 0) {
      happiness += Math.floor(totalHappinessBonus / houseCount);
    }
    // Pottery happiness: +8 if have pottery, but scales with pottery amount
    if (newResources.pottery > 0) {
      const potteryBonus = Math.min(12, 5 + newResources.pottery);
      happiness += potteryBonus;
    }
    if (newResources.food <= 0) happiness -= 20;
    // Guard tower security bonus: each guard tower reduces anxiety
    const guardCount = countBuildings(newMap, BuildingType.GUARD_TOWER);
    if (guardCount > 0) {
      happiness += Math.min(10, guardCount * 3);
    }

    // Process active events
    let updatedActiveEvents = [...state.activeEvents];
    let eventHappinessPenalty = 0;
    for (let i = updatedActiveEvents.length - 1; i >= 0; i--) {
      const evt = updatedActiveEvents[i];
      if (evt.remainingTicks !== undefined && evt.remainingTicks > 0) {
        evt.remainingTicks -= 1;
        if (evt.remainingTicks <= 0) {
          updatedActiveEvents.splice(i, 1);
        } else {
          if (evt.type === GameEventType.PLAGUE) {
            eventHappinessPenalty -= 15;
          }
        }
      }
    }
    happiness += eventHappinessPenalty;
    happiness = Math.max(0, Math.min(100, happiness));

    // Victory check
    let highestPop = Math.max(state.highestPopulation, newPopulation);
    let currentRank = state.currentRank;
    let victoryNotification: string | null = null;

    for (const tier of VICTORY_TIERS) {
      if (newPopulation >= tier.population && highestPop >= tier.population) {
        const prevIndex = VICTORY_TIERS.findIndex(t => t.name === currentRank);
        const tierIndex = VICTORY_TIERS.findIndex(t => t.name === tier.name);
        if (tierIndex > prevIndex) {
          currentRank = tier.name;
          victoryNotification = `恭喜晋升为 ${tier.emoji} ${tier.name}！`;
        }
      }
    }

    const newTickCount = state.tickCount + 1;

    // Process random events
    let newNotifications = [...state.notifications];
    let newLastEventTick = state.lastEventTick;

    if (newPopulation >= 10 && newTickCount - state.lastEventTick >= 20) {
      // Guard towers also reduce barbarian event probability
      const guardCount2 = countBuildings(newMap, BuildingType.GUARD_TOWER);
      const eventChance = 0.02 + (newPopulation / 1000) * 0.03;
      if (Math.random() < eventChance) {
        const eventResult = processRandomEvent(newMap, newResources, newPopulation, newTickCount);
        if (eventResult) {
          const { event: gameEvent, description } = eventResult;

          if (gameEvent.type === GameEventType.FIRE || gameEvent.type === GameEventType.EARTHQUAKE) {
            const newMaxPop = calculateMaxPopulation(newMap);
            if (newPopulation > newMaxPop) newPopulation = newMaxPop;
          }
          if (gameEvent.type === GameEventType.BARBARIAN || gameEvent.type === GameEventType.PLAGUE) {
            newPopulation = Math.max(0, newPopulation - (eventResult.populationLoss || 0));
          }
          if (gameEvent.type === GameEventType.GOOD_HARVEST) {
            newResources.food += eventResult.resourceGain || 0;
          }
          if (gameEvent.type === GameEventType.GOLD_DISCOVERY) {
            newResources.gold += eventResult.resourceGain || 0;
          }
          if (gameEvent.type === GameEventType.IMMIGRANTS) {
            newPopulation = Math.min(maxPop, newPopulation + (eventResult.populationGain || 0));
          }

          if (gameEvent.type === GameEventType.PLAGUE) {
            gameEvent.remainingTicks = 10;
            updatedActiveEvents.push(gameEvent);
          }

          // Guard towers can block barbarian events entirely (20% chance per tower, max 80%)
          if (gameEvent.type === GameEventType.BARBARIAN && guardCount2 > 0) {
            const blockChance = Math.min(0.8, guardCount2 * 0.2);
            if (Math.random() < blockChance) {
              // Barbarians were repelled by guards!
              gameEvent.description = `蛮族来袭，但被${guardCount2}座警卫塔成功击退！无人伤亡！`;
              gameEvent.severity = 'good';
              // Undo the population loss
              if (eventResult.populationLoss) {
                eventResult.populationLoss = 0;
              }
              // Add happiness bonus for successful defense
              happiness = Math.min(100, happiness + 3);
            }
          }

          const notification: GameNotification = {
            id: `notif-${++notificationIdCounter}-${Date.now()}`,
            event: { ...gameEvent, description },
            timestamp: Date.now(),
            read: false,
          };
          newNotifications.unshift(notification);
          if (newNotifications.length > 50) {
            newNotifications = newNotifications.slice(0, 50);
          }
          newLastEventTick = newTickCount;
        }
      }
    }

    // Update pedestrians
    const newPedestrians = updatePedestrians(state.pedestrians, newMap);

    const workersAvailable = Math.max(0, newPopulation - totalWorkersNeeded);

    set({
      map: newMap,
      resources: newResources,
      population: newPopulation,
      maxPopulation: maxPop,
      happiness,
      highestPopulation: highestPop,
      currentRank,
      tickCount: newTickCount,
      victoryNotification,
      notifications: newNotifications,
      activeEvents: updatedActiveEvents,
      lastEventTick: newLastEventTick,
      pedestrians: newPedestrians,
      workersNeeded: totalWorkersNeeded,
      workersAvailable,
      storageCapacity: storageCap,
    });
  },

  getProductionRates: () => {
    const state = get();
    const rates: ProductionRates = { food: 0, wood: 0, stone: 0, pottery: 0, gold: 0, workersNeeded: 0, workersAvailable: 0, workerEfficiency: 1 };

    const totalWorkersNeeded = calculateWorkersNeeded(state.map);
    const workerEfficiency = totalWorkersNeeded > 0
      ? Math.min(1, state.population / totalWorkersNeeded)
      : (state.population > 0 ? 1 : 0);
    rates.workersNeeded = totalWorkersNeeded;
    rates.workersAvailable = Math.max(0, state.population - totalWorkersNeeded);
    rates.workerEfficiency = workerEfficiency;

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const tile = state.map[y][x];
        if (!tile.building) continue;
        const def = BUILDING_DEFS[tile.building];
        if (!def) continue;

        if (def.production) {
          let canProduce = true;
          if (def.needsNearby) {
            if (def.needsNearby.resource === 'well_water') {
              canProduce = findNearbyBuilding(state.map, x, y, BuildingType.WELL, def.needsNearby.range);
            } else if (def.needsNearby.type === BuildingType.WAREHOUSE) {
              canProduce = findNearbyBuilding(state.map, x, y, BuildingType.WAREHOUSE, def.needsNearby.range);
            }
          }
          // Road access check
          if (canProduce && !ROAD_EXEMPT_BUILDINGS.has(tile.building)) {
            canProduce = hasRoadAccess(state.map, x, y);
          }
          if (canProduce) {
            if (def.production.food) rates.food += def.production.food;
            if (def.production.wood) rates.wood += def.production.wood;
            if (def.production.stone) rates.stone += def.production.stone;
            if (def.production.pottery) rates.pottery += def.production.pottery;
          }
        }

        if (tile.building === BuildingType.TAX_OFFICE && def.range) {
          if (hasRoadAccess(state.map, x, y) && workerEfficiency > 0) {
            let nearbyPop = 0;
            for (let dy = -def.range; dy <= def.range; dy++) {
              for (let dx = -def.range; dx <= def.range; dx++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist <= def.range) {
                  const tx = x + dx;
                  const ty = y + dy;
                  if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
                    if (state.map[ty][tx].building === BuildingType.HOUSE) {
                      const hLevel = state.map[ty][tx].houseLevel || 0;
                      const lvl = HOUSE_LEVELS[Math.min(hLevel, HOUSE_LEVELS.length - 1)];
                      nearbyPop += lvl.populationCapacity;
                    }
                  }
                }
              }
            }
            const popRatio = state.population > 0 ? Math.min(1, nearbyPop / Math.max(1, state.population)) : 0;
            const taxGold = Math.floor(5 * Math.ceil(state.population / 10) * popRatio * workerEfficiency);
            rates.gold += taxGold;
          }
        }
      }
    }
    return rates;
  },

  getCurrentRank: () => get().currentRank,

  getBuildingCounts: () => {
    const state = get();
    const counts: Record<string, number> = {};
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const b = state.map[y][x].building;
        if (b) counts[b] = (counts[b] || 0) + 1;
      }
    }
    return counts;
  },
}));

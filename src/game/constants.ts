// ===== 傻子大帝 - Game Constants =====
import { BuildingType, type BuildingDef, type Resources, type VictoryTier, GameEventType, type GameEvent } from './types';

// Map
export const MAP_SIZE = 60;
export const TILE_WIDTH = 48;
export const TILE_HEIGHT = 48;

// Starting resources
export const STARTING_RESOURCES: Resources = {
  food: 100,
  wood: 50,
  stone: 30,
  pottery: 0,
  gold: 500,
};

// Game speeds (ms per tick)
export const GAME_SPEEDS: Record<number, number> = {
  0: 0,      // paused
  1: 1000,   // 1x
  2: 500,    // 2x
  3: 333,    // 3x
};

// Victory tiers
export const VICTORY_TIERS: VictoryTier[] = [
  { name: '小村长', population: 100, emoji: '🏘️' },
  { name: '城镇总督', population: 200, emoji: '🏛️' },
  { name: '行省总督', population: 500, emoji: '👑' },
  { name: '傻子大帝', population: 1000, emoji: '👑' },
];

// Building definitions
export const BUILDING_DEFS: Record<string, BuildingDef> = {
  [BuildingType.ROAD]: {
    type: BuildingType.ROAD,
    name: '道路',
    emoji: '🛤️',
    cost: { gold: 2, wood: 0, stone: 0 },
    color: '#8B7355',
  },
  [BuildingType.HOUSE]: {
    type: BuildingType.HOUSE,
    name: '住宅',
    emoji: '🏠',
    cost: { gold: 10, wood: 5, stone: 2 },
    color: '#D4A574',
    roofColor: '#8B4513',
    populationCapacity: 10,
  },
  [BuildingType.FARM]: {
    type: BuildingType.FARM,
    name: '农场',
    emoji: '🌾',
    cost: { gold: 15, wood: 3, stone: 0 },
    color: '#90EE90',
    production: { food: 3 },
    needsNearby: { type: BuildingType.WELL, range: 3, resource: 'well_water' },
    workersNeeded: 3,
  },
  [BuildingType.WELL]: {
    type: BuildingType.WELL,
    name: '水井',
    emoji: '⛲',
    cost: { gold: 8, wood: 1, stone: 2 },
    color: '#87CEEB',
    range: 3,
  },
  [BuildingType.WAREHOUSE]: {
    type: BuildingType.WAREHOUSE,
    name: '仓库',
    emoji: '📦',
    cost: { gold: 20, wood: 8, stone: 5 },
    color: '#8B4513',
    roofColor: '#654321',
    range: 5,
    storageBonus: 150,
  },
  [BuildingType.MARKET]: {
    type: BuildingType.MARKET,
    name: '市场',
    emoji: '🏪',
    cost: { gold: 25, wood: 5, stone: 3 },
    color: '#DAA520',
    roofColor: '#B8860B',
    happinessBonus: 8,
    range: 4,
  },
  [BuildingType.LUMBER_MILL]: {
    type: BuildingType.LUMBER_MILL,
    name: '伐木场',
    emoji: '🪓',
    cost: { gold: 20, wood: 0, stone: 2 },
    color: '#228B22',
    production: { wood: 2 },
    workersNeeded: 2,
  },
  [BuildingType.QUARRY]: {
    type: BuildingType.QUARRY,
    name: '采石场',
    emoji: '⛏️',
    cost: { gold: 20, wood: 2, stone: 0 },
    color: '#808080',
    production: { stone: 2 },
    workersNeeded: 3,
  },
  [BuildingType.POTTERY_WORKSHOP]: {
    type: BuildingType.POTTERY_WORKSHOP,
    name: '陶器工坊',
    emoji: '🏺',
    cost: { gold: 30, wood: 3, stone: 5 },
    color: '#CD853F',
    roofColor: '#A0522D',
    production: { pottery: 1 },
    needsNearby: { type: BuildingType.WAREHOUSE, range: 5 },
    workersNeeded: 2,
  },
  [BuildingType.TAX_OFFICE]: {
    type: BuildingType.TAX_OFFICE,
    name: '征税站',
    emoji: '💰',
    cost: { gold: 35, wood: 5, stone: 5 },
    color: '#B8860B',
    roofColor: '#8B6914',
    range: 5,
    workersNeeded: 1,
  },
  [BuildingType.TEMPLE]: {
    type: BuildingType.TEMPLE,
    name: '神庙',
    emoji: '🏛️',
    cost: { gold: 50, wood: 10, stone: 8 },
    color: '#F5F5F5',
    roofColor: '#FFD700',
    happinessBonus: 10,
    range: 5,
  },
  [BuildingType.GARDEN]: {
    type: BuildingType.GARDEN,
    name: '花园',
    emoji: '🌸',
    cost: { gold: 5, wood: 1, stone: 0 },
    color: '#32CD32',
    desirabilityBonus: 3,
  },
  [BuildingType.GUARD_TOWER]: {
    type: BuildingType.GUARD_TOWER,
    name: '警卫塔',
    emoji: '🗼',
    cost: { gold: 30, wood: 5, stone: 3 },
    color: '#696969',
    roofColor: '#555555',
    happinessBonus: 5,
    range: 5,
  },
  [BuildingType.FIRE_STATION]: {
    type: BuildingType.FIRE_STATION,
    name: '消防站',
    emoji: '🚒',
    cost: { gold: 40, wood: 8, stone: 5 },
    color: '#CC3333',
    roofColor: '#991111',
    happinessBonus: 3,
    range: 6,
  },
  [BuildingType.BRIDGE]: {
    type: BuildingType.BRIDGE,
    name: '桥梁',
    emoji: '🌉',
    cost: { gold: 15, wood: 5, stone: 3 },
    color: '#8B7355',
  },
};

// Building order for UI
export const BUILD_ORDER: BuildingType[] = [
  BuildingType.HOUSE,
  BuildingType.ROAD,
  BuildingType.BRIDGE,
  BuildingType.FARM,
  BuildingType.WELL,
  BuildingType.WAREHOUSE,
  BuildingType.MARKET,
  BuildingType.LUMBER_MILL,
  BuildingType.QUARRY,
  BuildingType.POTTERY_WORKSHOP,
  BuildingType.TAX_OFFICE,
  BuildingType.TEMPLE,
  BuildingType.GARDEN,
  BuildingType.GUARD_TOWER,
  BuildingType.FIRE_STATION,
];

// Desirability modifiers per building type
export const DESIRABILITY_EFFECTS: Record<string, number> = {
  [BuildingType.ROAD]: 1,
  [BuildingType.HOUSE]: 0,
  [BuildingType.FARM]: -1,
  [BuildingType.WELL]: 2,
  [BuildingType.WAREHOUSE]: -2,
  [BuildingType.MARKET]: 3,
  [BuildingType.LUMBER_MILL]: -3,
  [BuildingType.QUARRY]: -4,
  [BuildingType.POTTERY_WORKSHOP]: -2,
  [BuildingType.TAX_OFFICE]: -1,
  [BuildingType.TEMPLE]: 5,
  [BuildingType.GARDEN]: 4,
  [BuildingType.GUARD_TOWER]: 1,
  [BuildingType.FIRE_STATION]: 1,
  [BuildingType.BRIDGE]: 0,
};

// Food consumption
export const FOOD_PER_PERSON_PER_TICK = 0.5;

// Storage system
export const BASE_STORAGE = 200; // Base storage without warehouses
export const WAREHOUSE_STORAGE_BONUS = 150; // Each warehouse adds this much storage
export const GOLD_STORAGE_MULTIPLIER = 5; // Gold gets extra storage

// Trade options for market
export const TRADE_OPTIONS: { id: string; name: string; emoji: string; giveResource: keyof Resources; giveAmount: number; receiveResource: keyof Resources; receiveAmount: number }[] = [
  { id: 'sell_food', name: '出售食物', emoji: '🍞', giveResource: 'food', giveAmount: 10, receiveResource: 'gold', receiveAmount: 5 },
  { id: 'sell_wood', name: '出售木材', emoji: '🪵', giveResource: 'wood', giveAmount: 10, receiveResource: 'gold', receiveAmount: 4 },
  { id: 'sell_stone', name: '出售石材', emoji: '🪨', giveResource: 'stone', giveAmount: 10, receiveResource: 'gold', receiveAmount: 6 },
  { id: 'sell_pottery', name: '出售陶器', emoji: '🏺', giveResource: 'pottery', giveAmount: 5, receiveResource: 'gold', receiveAmount: 8 },
  { id: 'buy_food', name: '购买食物', emoji: '🍞', giveResource: 'gold', giveAmount: 5, receiveResource: 'food', receiveAmount: 10 },
  { id: 'buy_wood', name: '购买木材', emoji: '🪵', giveResource: 'gold', giveAmount: 4, receiveResource: 'wood', receiveAmount: 10 },
  { id: 'buy_stone', name: '购买石材', emoji: '🪨', giveResource: 'gold', giveAmount: 6, receiveResource: 'stone', receiveAmount: 10 },
  { id: 'buy_pottery', name: '购买陶器', emoji: '🏺', giveResource: 'gold', giveAmount: 8, receiveResource: 'pottery', receiveAmount: 5 },
];

// Trade cooldown (ticks)
export const TRADE_COOLDOWN = 3;

// House level definitions
// Higher levels need more happiness, desirability, and food
export const HOUSE_LEVELS = [
  { level: 0, name: '茅草屋',   populationCapacity: 10,  happinessReq: 0,   desirabilityReq: -999, color: '#D4A574', roofColor: '#8B4513' },
  { level: 1, name: '小屋',     populationCapacity: 15,  happinessReq: 35,  desirabilityReq: 0,    color: '#C9956B', roofColor: '#7A4020' },
  { level: 2, name: '砖房',     populationCapacity: 25,  happinessReq: 50,  desirabilityReq: 5,    color: '#B8845C', roofColor: '#6B3A18' },
  { level: 3, name: '大宅',     populationCapacity: 40,  happinessReq: 65,  desirabilityReq: 15,   color: '#A8734E', roofColor: '#5C3010' },
  { level: 4, name: '豪宅',     populationCapacity: 60,  happinessReq: 80,  desirabilityReq: 25,   color: '#E8D5B7', roofColor: '#B8860B' },
];

// Max pedestrians on the map
export const MAX_PEDESTRIANS = 30;

// Fire station fire reduction multiplier (0.4 = 60% fire reduction)
export const FIRE_STATION_REDUCTION = 0.4;

// Max camera zoom
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3.0;

// Touch thresholds
export const TAP_THRESHOLD = 10; // pixels
export const LONG_PRESS_DURATION = 500; // ms

// Auto-save interval
export const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// Save key
export const SAVE_KEY = 'shazi-di-da-save';

// Terrain colors
export const TERRAIN_COLORS = {
  grass: '#4a8c3f',
  water: '#3b7dd8',
  desert: '#c2a64e',
  forest: '#2d6b2e',
};

// Event definitions
export interface EventDef {
  type: GameEventType;
  title: string;
  emoji: string;
  descriptionTemplate: string;
  severity: 'good' | 'bad' | 'neutral';
  weight: number;
  minPopulation: number;
  minBuildings: number;
}

export const EVENT_DEFS: EventDef[] = [
  {
    type: GameEventType.FIRE,
    title: '火灾',
    emoji: '🔥',
    descriptionTemplate: '大火烧毁了{count}座建筑！',
    severity: 'bad',
    weight: 15,
    minPopulation: 10,
    minBuildings: 1,
  },
  {
    type: GameEventType.BARBARIAN,
    title: '蛮族入侵',
    emoji: '⚔️',
    descriptionTemplate: '蛮族来袭，{count}人不幸遇难！',
    severity: 'bad',
    weight: 15,
    minPopulation: 20,
    minBuildings: 0,
  },
  {
    type: GameEventType.PLAGUE,
    title: '瘟疫',
    emoji: '😷',
    descriptionTemplate: '瘟疫蔓延，{count}人病亡，幸福度下降！',
    severity: 'bad',
    weight: 10,
    minPopulation: 20,
    minBuildings: 0,
  },
  {
    type: GameEventType.EARTHQUAKE,
    title: '地震',
    emoji: '💥',
    descriptionTemplate: '地震摧毁了{count}座建筑！',
    severity: 'bad',
    weight: 10,
    minPopulation: 10,
    minBuildings: 2,
  },
  {
    type: GameEventType.GOOD_HARVEST,
    title: '丰收',
    emoji: '🌾',
    descriptionTemplate: '风调雨顺，获得{count}食物！',
    severity: 'good',
    weight: 20,
    minPopulation: 10,
    minBuildings: 0,
  },
  {
    type: GameEventType.GOLD_DISCOVERY,
    title: '发现金矿',
    emoji: '💰',
    descriptionTemplate: '矿工发现了金矿脉，获得{count}金币！',
    severity: 'good',
    weight: 15,
    minPopulation: 10,
    minBuildings: 0,
  },
  {
    type: GameEventType.IMMIGRANTS,
    title: '移民到来',
    emoji: '👥',
    descriptionTemplate: '一批移民慕名而来，增加了{count}人口！',
    severity: 'good',
    weight: 15,
    minPopulation: 10,
    minBuildings: 0,
  },
];

// ===== 傻子大帝 - Map Generator =====
import { TerrainType, BuildingType, type Tile } from './types';
import { MAP_SIZE } from './constants';

// Simple seeded random for reproducible maps
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMap(seed?: number): Tile[][] {
  const rand = seededRandom(seed ?? Date.now());
  const map: Tile[][] = [];

  for (let y = 0; y < MAP_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      map[y][x] = {
        x,
        y,
        terrain: TerrainType.GRASS,
        building: null,
        desirability: 0,
        happinessBonus: 0,
        houseLevel: 0,
      };
    }
  }

  // Create 2 lakes
  const lake1X = 30 + Math.floor(rand() * 10);
  const lake1Y = 15 + Math.floor(rand() * 10);
  const lake1Radius = 4 + Math.floor(rand() * 3);
  createWaterBody(map, lake1X, lake1Y, lake1Radius, rand);

  const lake2X = 10 + Math.floor(rand() * 10);
  const lake2Y = 40 + Math.floor(rand() * 10);
  const lake2Radius = 3 + Math.floor(rand() * 3);
  createWaterBody(map, lake2X, lake2Y, lake2Radius, rand);

  // Create 1 river (wider, winding through the map)
  let riverX = 8 + Math.floor(rand() * 6);
  for (let ry = 0; ry < MAP_SIZE; ry++) {
    const width = ry % 4 === 0 ? 3 : (ry % 2 === 0 ? 2 : 1);
    for (let w = 0; w < width; w++) {
      const rx = riverX + w;
      if (rx >= 0 && rx < MAP_SIZE) {
        map[ry][rx].terrain = TerrainType.WATER;
      }
    }
    if (rand() > 0.45) riverX += 1;
    else if (rand() > 0.7) riverX -= 1;
    riverX = Math.max(2, Math.min(MAP_SIZE - 4, riverX));
  }

  // Create 6-8 forest patches
  const forestCount = 6 + Math.floor(rand() * 3);
  for (let i = 0; i < forestCount; i++) {
    const fx = Math.floor(rand() * MAP_SIZE);
    const fy = Math.floor(rand() * MAP_SIZE);
    const fRadius = 3 + Math.floor(rand() * 3);
    createForestPatch(map, fx, fy, fRadius, rand);
  }

  // Create 2 desert areas
  const desert1X = 40 + Math.floor(rand() * 10);
  const desert1Y = 5 + Math.floor(rand() * 8);
  const desert1Radius = 4 + Math.floor(rand() * 3);
  createDesertArea(map, desert1X, desert1Y, desert1Radius, rand);

  const desert2X = 5 + Math.floor(rand() * 10);
  const desert2Y = 45 + Math.floor(rand() * 8);
  const desert2Radius = 3 + Math.floor(rand() * 3);
  createDesertArea(map, desert2X, desert2Y, desert2Radius, rand);

  // Ensure a 6x6 grass starting area at top-left corner
  for (let dy = 0; dy < 6; dy++) {
    for (let dx = 0; dx < 6; dx++) {
      if (dy < MAP_SIZE && dx < MAP_SIZE) {
        map[dy][dx].terrain = TerrainType.GRASS;
      }
    }
  }

  return map;
}

function createWaterBody(map: Tile[][], cx: number, cy: number, radius: number, rand: () => number) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius + (rand() * 0.8 - 0.4)) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
          map[ty][tx].terrain = TerrainType.WATER;
        }
      }
    }
  }
}

function createForestPatch(map: Tile[][], cx: number, cy: number, radius: number, rand: () => number) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius && rand() > 0.2) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
          if (map[ty][tx].terrain === TerrainType.GRASS) {
            map[ty][tx].terrain = TerrainType.FOREST;
          }
        }
      }
    }
  }
}

function createDesertArea(map: Tile[][], cx: number, cy: number, radius: number, rand: () => number) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius && rand() > 0.3) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
          if (map[ty][tx].terrain === TerrainType.GRASS) {
            map[ty][tx].terrain = TerrainType.DESERT;
          }
        }
      }
    }
  }
}

// Get distance between two tiles (Manhattan distance)
export function tileDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Check if there's a building of given type within range
// Bridge is treated as road for adjacency purposes
export function findNearbyBuilding(
  map: Tile[][],
  cx: number,
  cy: number,
  buildingType: string,
  range: number
): boolean {
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      if (tileDistance(cx, cy, cx + dx, cy + dy) <= range) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
          const tileBuilding = map[ty][tx].building;
          if (tileBuilding === buildingType) {
            return true;
          }
          // Bridge is treated as road for adjacency purposes
          if (buildingType === BuildingType.ROAD && tileBuilding === BuildingType.BRIDGE) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Count buildings of a type near a position within range
export function countNearbyBuildings(
  map: Tile[][],
  cx: number,
  cy: number,
  range: number
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      if (tileDistance(cx, cy, cx + dx, cy + dy) <= range) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
          const b = map[ty][tx].building;
          if (b) {
            counts[b] = (counts[b] || 0) + 1;
          }
        }
      }
    }
  }
  return counts;
}

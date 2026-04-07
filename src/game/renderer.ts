// ===== 傻子大帝 - Top-Down Canvas Renderer =====
import { TerrainType, BuildingType } from './types';
import { TILE_WIDTH, TILE_HEIGHT, MAP_SIZE, BUILDING_DEFS, TERRAIN_COLORS, HOUSE_LEVELS } from './constants';
import type { Tile, Pedestrian } from './types';
import type { RenderState } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private width: number = 0;
  private height: number = 0;
  private animTime: number = 0;
  private grassVariation: Map<string, number> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    // Pre-generate grass variation
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        this.grassVariation.set(`${x},${y}`, Math.random() * 0.08 - 0.04);
      }
    }
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
  }

  render(
    map: Tile[][],
    cameraX: number,
    cameraY: number,
    zoom: number,
    renderState: RenderState,
    selectedBuilding: BuildingType | null,
    isDemolishMode: boolean
  ): void {
    this.animTime = performance.now() / 1000;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background
    ctx.fillStyle = '#2a3a2a';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(cameraX + this.width / 2, cameraY + this.height / 2);
    ctx.scale(zoom, zoom);

    const halfMapW = (MAP_SIZE * TILE_WIDTH) / 2;
    const halfMapH = (MAP_SIZE * TILE_HEIGHT) / 2;

    const leftWorld = -(cameraX + this.width / 2) / zoom;
    const rightWorld = (this.width / 2 - cameraX) / zoom;
    const topWorld = -(cameraY + this.height / 2) / zoom;
    const bottomWorld = (this.height / 2 - cameraY) / zoom;

    const minTileX = Math.max(0, Math.floor((leftWorld + halfMapW) / TILE_WIDTH) - 1);
    const minTileY = Math.max(0, Math.floor((topWorld + halfMapH) / TILE_HEIGHT) - 1);
    const maxTileX = Math.min(MAP_SIZE - 1, Math.ceil((rightWorld + halfMapW) / TILE_WIDTH) + 1);
    const maxTileY = Math.min(MAP_SIZE - 1, Math.ceil((bottomWorld + halfMapH) / TILE_HEIGHT) + 1);

    // Draw tiles
    for (let y = minTileY; y <= maxTileY; y++) {
      for (let x = minTileX; x <= maxTileX; x++) {
        const tile = map[y][x];
        const sx = x * TILE_WIDTH - halfMapW;
        const sy = y * TILE_HEIGHT - halfMapH;
        this.drawTile(tile, sx, sy, renderState, selectedBuilding, isDemolishMode, map);
      }
    }

    // Draw pedestrians on top of everything
    this.drawPedestrians(renderState.pedestrians, halfMapW, halfMapH);

    ctx.restore();
  }

  private drawPedestrians(pedestrians: Pedestrian[], halfMapW: number, halfMapH: number): void {
    const ctx = this.ctx;
    const tw = TILE_WIDTH;
    const th = TILE_HEIGHT;

    for (const p of pedestrians) {
      // Interpolate position
      const wx = (p.x + (p.targetX - p.x) * p.progress) * tw - halfMapW + tw / 2;
      const wy = (p.y + (p.targetY - p.y) * p.progress) * th - halfMapH + th / 2;

      // Walking bob animation
      const bob = Math.sin(this.animTime * 8 + p.x * 3 + p.y * 7) * 1.5;

      if (p.isFirefighter) {
        // Firefighter: red uniform, slightly larger
        ctx.fillStyle = '#CC2222';
        ctx.beginPath();
        ctx.arc(wx, wy + bob - 1, 4, 0, Math.PI * 2);
        ctx.fill();
        // Helmet
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(wx, wy + bob - 4, 3, Math.PI, 0);
        ctx.fill();
      } else {
        // Normal person: body
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(wx, wy + bob, 3, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(wx, wy + bob - 3.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawTile(
    tile: Tile,
    sx: number,
    sy: number,
    renderState: RenderState,
    selectedBuilding: BuildingType | null,
    isDemolishMode: boolean,
    map: Tile[][]
  ): void {
    const ctx = this.ctx;
    const tw = TILE_WIDTH;
    const th = TILE_HEIGHT;

    this.drawTerrain(tile, sx, sy, tw, th);

    if (tile.building) {
      if (tile.building === BuildingType.BRIDGE) {
        this.drawBridge(sx, sy, tw, th);
      } else {
        this.drawBuilding(tile.building, sx, sy, tw, th, tile);
        // Show road access warning for non-exempt buildings without road
        if (!isRoadExempt(tile.building) && !hasRoadAccess(map, tile.x, tile.y)) {
          // Draw a small "no road" warning icon
          ctx.save();
          ctx.globalAlpha = 0.7 + Math.sin(this.animTime * 4) * 0.3;
          ctx.fillStyle = '#ff6600';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('⚠', sx + tw - 14, sy + 12);
          ctx.restore();
        }
      }
    }

    // Highlight tile under cursor
    const isHighlighted = renderState.highlightedTile &&
      renderState.highlightedTile.x === tile.x &&
      renderState.highlightedTile.y === tile.y;

    if (isHighlighted) {
      if (isDemolishMode && tile.building) {
        ctx.save();
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, tw, th);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(sx, sy, tw, th);
        ctx.restore();
      } else if (selectedBuilding && !tile.building) {
        const canPlaceOnWater = selectedBuilding === BuildingType.BRIDGE && tile.terrain === TerrainType.WATER;
        const canPlaceOnNormal = tile.terrain !== TerrainType.WATER && tile.terrain !== TerrainType.FOREST;

        if (canPlaceOnWater || canPlaceOnNormal) {
          ctx.save();
          ctx.strokeStyle = '#44ff44';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx, sy, tw, th);
          if (selectedBuilding !== BuildingType.DEMOLISH) {
            ctx.globalAlpha = 0.5;
            if (selectedBuilding === BuildingType.BRIDGE) {
              this.drawBridge(sx, sy, tw, th);
            } else {
              this.drawBuilding(selectedBuilding, sx, sy, tw, th, tile);
            }
            ctx.globalAlpha = 1;
          }
          ctx.restore();
        } else {
          ctx.save();
          ctx.strokeStyle = '#ff3333';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx, sy, tw, th);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
          ctx.fillRect(sx, sy, tw, th);
          ctx.restore();
        }
      } else if (!selectedBuilding && !isDemolishMode) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(sx, sy, tw, th);
        ctx.restore();
      }
    }

    // Draw range circle for service buildings
    if (renderState.buildingRangePreview &&
        renderState.buildingRangePreview.x === tile.x &&
        renderState.buildingRangePreview.y === tile.y) {
      const range = renderState.buildingRangePreview.range;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 100, 0.4)';
      ctx.lineWidth = 1;
      const centerX = sx + tw / 2;
      const centerY = sy + th / 2;
      const rangeW = range * 2 * tw + tw;
      const rangeH = range * 2 * th + th;
      ctx.strokeRect(centerX - rangeW / 2, centerY - rangeH / 2, rangeW, rangeH);
      ctx.fillStyle = 'rgba(255, 255, 100, 0.08)';
      ctx.fillRect(centerX - rangeW / 2, centerY - rangeH / 2, rangeW, rangeH);
      ctx.restore();
    }
  }

  private drawTerrain(tile: Tile, sx: number, sy: number, tw: number, th: number): void {
    const ctx = this.ctx;

    switch (tile.terrain) {
      case TerrainType.GRASS: {
        const variation = this.grassVariation.get(`${tile.x},${tile.y}`) || 0;
        const r = 0x4a + Math.round(variation * 0xff);
        const g = 0x8c + Math.round(variation * 0xff);
        const b = 0x3f + Math.round(variation * 0xff);
        ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r))},${Math.min(255, Math.max(0, g))},${Math.min(255, Math.max(0, b))})`;
        ctx.fillRect(sx, sy, tw, th);
        ctx.fillStyle = 'rgba(60, 120, 50, 0.3)';
        const gs = (tile.x * 7 + tile.y * 13) % 5;
        for (let i = 0; i < 3; i++) {
          const dx = ((gs + i * 11) % 36) + 2;
          const dy = ((gs + i * 17) % 36) + 2;
          ctx.fillRect(sx + dx, sy + dy, 1.5, 1.5);
        }
        break;
      }
      case TerrainType.WATER: {
        const wave = Math.sin(this.animTime * 2 + tile.x * 0.5 + tile.y * 0.3) * 15;
        const baseR = 0x3b;
        const baseG = 0x7d + Math.round(wave * 0.3);
        const baseB = 0xd8 + Math.round(wave * 0.5);
        ctx.fillStyle = `rgb(${baseR},${Math.min(255, Math.max(0, baseG))},${Math.min(255, Math.max(0, baseB))})`;
        ctx.fillRect(sx, sy, tw, th);
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
        ctx.lineWidth = 0.8;
        const waveOffset = Math.sin(this.animTime * 1.5 + tile.x) * 3;
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + th * 0.4 + waveOffset);
        ctx.quadraticCurveTo(sx + tw / 2, sy + th * 0.4 + waveOffset - 3, sx + tw - 4, sy + th * 0.4 + waveOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + 8, sy + th * 0.7 + waveOffset);
        ctx.quadraticCurveTo(sx + tw / 2, sy + th * 0.7 + waveOffset - 2, sx + tw - 8, sy + th * 0.7 + waveOffset);
        ctx.stroke();
        break;
      }
      case TerrainType.FOREST: {
        ctx.fillStyle = '#2d6b2e';
        ctx.fillRect(sx, sy, tw, th);
        ctx.fillStyle = '#5d3a1a';
        ctx.beginPath(); ctx.arc(sx + tw * 0.3, sy + th * 0.35, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a5c1a';
        ctx.beginPath(); ctx.arc(sx + tw * 0.3, sy + th * 0.3, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#227022';
        ctx.beginPath(); ctx.arc(sx + tw * 0.3, sy + th * 0.28, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5d3a1a';
        ctx.beginPath(); ctx.arc(sx + tw * 0.7, sy + th * 0.65, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a5c1a';
        ctx.beginPath(); ctx.arc(sx + tw * 0.7, sy + th * 0.6, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#227022';
        ctx.beginPath(); ctx.arc(sx + tw * 0.7, sy + th * 0.58, 5, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case TerrainType.DESERT: {
        ctx.fillStyle = '#c2a64e';
        ctx.fillRect(sx, sy, tw, th);
        ctx.fillStyle = 'rgba(180, 150, 60, 0.5)';
        const dotSeed = (tile.x * 7 + tile.y * 13) % 5;
        for (let i = 0; i < 5; i++) {
          const dx = ((dotSeed + i * 7) % 40) + 2;
          const dy = ((dotSeed + i * 11) % 40) + 2;
          ctx.fillRect(sx + dx, sy + dy, 1.5, 1.5);
        }
        break;
      }
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx, sy, tw, th);
  }

  private drawBuilding(buildingType: BuildingType, sx: number, sy: number, tw: number, th: number, tile: Tile): void {
    const ctx = this.ctx;
    const def = BUILDING_DEFS[buildingType];
    if (!def) return;

    const cx = sx + tw / 2;
    const cy = sy + th / 2;
    const padding = 4;

    switch (buildingType) {
      case BuildingType.ROAD: {
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(sx + 2, sy + 2, tw - 4, th - 4);
        ctx.strokeStyle = '#7a6345';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 2, sy + 2, tw - 4, th - 4);
        ctx.strokeStyle = '#a08060';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(cx, sy + 4); ctx.lineTo(cx, sy + th - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx + 4, cy); ctx.lineTo(sx + tw - 4, cy); ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
      case BuildingType.HOUSE: {
        const level = tile.houseLevel || 0;
        const lvl = HOUSE_LEVELS[Math.min(level, HOUSE_LEVELS.length - 1)];

        if (level === 0) {
          // Level 0: Simple hut
          ctx.fillStyle = lvl.color;
          ctx.fillRect(sx + padding + 2, sy + padding + 4, tw - padding * 2 - 4, th - padding * 2 - 4);
          ctx.fillStyle = lvl.roofColor;
          ctx.beginPath();
          ctx.moveTo(sx + padding, sy + padding + 4);
          ctx.lineTo(cx, sy + 3);
          ctx.lineTo(sx + tw - padding, sy + padding + 4);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#654321';
          ctx.fillRect(cx - 2, sy + th - padding - 6, 4, 6);
        } else if (level === 1) {
          // Level 1: Small house
          ctx.fillStyle = lvl.color;
          ctx.fillRect(sx + padding, sy + padding + 3, tw - padding * 2, th - padding * 2 - 3);
          ctx.fillStyle = lvl.roofColor;
          ctx.beginPath();
          ctx.moveTo(sx + padding - 2, sy + padding + 3);
          ctx.lineTo(cx, sy + 1);
          ctx.lineTo(sx + tw - padding + 2, sy + padding + 3);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#654321';
          ctx.fillRect(cx - 3, sy + th - padding - 8, 6, 8);
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(sx + padding + 2, sy + padding + 8, 4, 3);
          ctx.fillRect(sx + tw - padding - 6, sy + padding + 8, 4, 3);
        } else if (level === 2) {
          // Level 2: Brick house (wider, two stories)
          ctx.fillStyle = lvl.color;
          ctx.fillRect(sx + padding - 1, sy + padding + 2, tw - padding * 2 + 2, th - padding * 2 - 2);
          // Second floor line
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx + padding - 1, sy + th / 2 + 2);
          ctx.lineTo(sx + tw - padding + 1, sy + th / 2 + 2);
          ctx.stroke();
          // Roof
          ctx.fillStyle = lvl.roofColor;
          ctx.fillRect(sx + padding - 2, sy + 2, tw - padding * 2 + 4, 5);
          // Windows (2 floors)
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(sx + padding + 2, sy + padding + 6, 5, 4);
          ctx.fillRect(sx + tw - padding - 7, sy + padding + 6, 5, 4);
          ctx.fillRect(sx + padding + 2, sy + th / 2 + 5, 5, 4);
          ctx.fillRect(sx + tw - padding - 7, sy + th / 2 + 5, 5, 4);
          ctx.fillStyle = '#654321';
          ctx.fillRect(cx - 3, sy + th - padding - 7, 6, 7);
        } else if (level === 3) {
          // Level 3: Mansion (ornate)
          ctx.fillStyle = lvl.color;
          ctx.fillRect(sx + padding - 2, sy + padding + 1, tw - padding * 2 + 4, th - padding * 2);
          // Roof
          ctx.fillStyle = lvl.roofColor;
          ctx.fillRect(sx + padding - 3, sy + 1, tw - padding * 2 + 6, 5);
          // Ornate trim
          ctx.strokeStyle = lvl.roofColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx + padding - 2, sy + padding + 1, tw - padding * 2 + 4, th - padding * 2);
          // Pillars
          ctx.fillStyle = '#F5F5F5';
          ctx.fillRect(sx + padding + 1, sy + padding + 4, 2, th - padding * 2 - 4);
          ctx.fillRect(sx + tw - padding - 3, sy + padding + 4, 2, th - padding * 2 - 4);
          // Windows
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(cx - 5, sy + padding + 6, 10, 5);
          ctx.fillRect(cx - 5, sy + th - padding - 10, 10, 5);
          // Door
          ctx.fillStyle = '#654321';
          ctx.fillRect(cx - 3, sy + th - padding - 8, 6, 8);
          // Star decoration
          ctx.fillStyle = '#FFD700';
          ctx.font = '8px serif';
          ctx.fillText('★', cx - 4, sy + padding + 14);
        } else {
          // Level 4: Luxury villa (golden accents)
          ctx.fillStyle = lvl.color;
          ctx.fillRect(sx + padding - 3, sy + padding, tw - padding * 2 + 6, th - padding * 2 + 1);
          // Grand roof with gold trim
          ctx.fillStyle = lvl.roofColor;
          ctx.fillRect(sx + padding - 4, sy, tw - padding * 2 + 8, 6);
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx + padding - 4, sy, tw - padding * 2 + 8, 6);
          // Grand pillars
          ctx.fillStyle = '#F5F5F5';
          ctx.fillRect(sx + padding - 1, sy + padding + 3, 3, th - padding * 2 - 2);
          ctx.fillRect(sx + tw - padding - 2, sy + padding + 3, 3, th - padding * 2 - 2);
          ctx.fillRect(cx - 1.5, sy + padding + 3, 3, th - padding * 2 - 2);
          // Large windows
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(cx - 7, sy + padding + 6, 6, 5);
          ctx.fillRect(cx + 1, sy + padding + 6, 6, 5);
          ctx.fillRect(cx - 7, sy + th - padding - 10, 6, 5);
          ctx.fillRect(cx + 1, sy + th - padding - 10, 6, 5);
          // Grand door
          ctx.fillStyle = '#8B6914';
          ctx.fillRect(cx - 4, sy + th - padding - 9, 8, 9);
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(cx - 1, sy + th - padding - 7, 2, 2);
          // Level indicator
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 10px serif';
          ctx.fillText('⭐', cx - 5, sy + th / 2 + 3);
        }
        break;
      }
      case BuildingType.FARM: {
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(sx + 2, sy + 2, tw - 4, th - 4);
        ctx.strokeStyle = '#5a8c3a';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const rowY = sy + 8 + i * 8;
          ctx.beginPath(); ctx.moveTo(sx + 6, rowY); ctx.lineTo(sx + tw - 6, rowY); ctx.stroke();
        }
        ctx.font = '14px serif';
        ctx.fillText('🌾', cx - 7, cy + 5);
        break;
      }
      case BuildingType.WELL: {
        ctx.fillStyle = '#A0A0A0';
        ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
        const waterWave = Math.sin(this.animTime * 3) * 0.15;
        ctx.fillStyle = `rgba(135, 206, 235, ${0.7 + waterWave})`;
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#808080'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy - 8); ctx.stroke();
        ctx.fillStyle = '#808080';
        ctx.fillRect(cx - 1, cy - 14, 2, 8);
        break;
      }
      case BuildingType.WAREHOUSE: {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(sx + 3, sy + 6, tw - 6, th - 9);
        ctx.fillStyle = '#654321';
        ctx.fillRect(sx + 1, sy + 2, tw - 2, 6);
        ctx.fillStyle = '#4a2a0a';
        ctx.fillRect(cx - 4, sy + th - 12, 8, 8);
        ctx.font = '12px serif';
        ctx.fillText('📦', cx + 6, cy);
        break;
      }
      case BuildingType.MARKET: {
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(sx + 5, sy + 8, tw - 10, th - 12);
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(sx + 3, sy + 4, tw - 6, 6);
        ctx.fillStyle = '#cc4444';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(sx + 5 + i * 8, sy + 4, 4, 6);
        }
        break;
      }
      case BuildingType.LUMBER_MILL: {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(sx + 5, sy + 8, tw - 10, th - 12);
        ctx.fillStyle = '#1a6b1a';
        ctx.fillRect(sx + 3, sy + 4, tw - 6, 6);
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(sx + tw - 12, sy + 14 + i * 5, 3, 0, Math.PI); ctx.fill();
        }
        break;
      }
      case BuildingType.QUARRY: {
        ctx.fillStyle = '#808080';
        ctx.fillRect(sx + 5, sy + 8, tw - 10, th - 12);
        ctx.fillStyle = '#a0a0a0';
        ctx.beginPath();
        ctx.moveTo(sx + tw - 8, sy + th - 6); ctx.lineTo(sx + tw - 4, sy + th - 6);
        ctx.lineTo(sx + tw - 5, sy + 10); ctx.lineTo(sx + tw - 10, sy + 10);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#909090';
        ctx.beginPath();
        ctx.moveTo(sx + tw - 10, sy + th - 6); ctx.lineTo(sx + tw - 6, sy + th - 6);
        ctx.lineTo(sx + tw - 7, sy + 14); ctx.lineTo(sx + tw - 12, sy + 14);
        ctx.closePath(); ctx.fill();
        break;
      }
      case BuildingType.POTTERY_WORKSHOP: {
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(sx + 5, sy + 8, tw - 10, th - 12);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(sx + 3, sy + 4, tw - 6, 6);
        ctx.fillStyle = '#808080';
        ctx.fillRect(sx + tw - 12, sy + 2, 5, 8);
        ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
        const smokeY = Math.sin(this.animTime * 2) * 2;
        ctx.beginPath(); ctx.arc(sx + tw - 10, sy + smokeY, 3, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case BuildingType.TAX_OFFICE: {
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(sx + 5, sy + 6, tw - 10, th - 10);
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(sx + 3, sy + 2, tw - 6, 6);
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(sx + 8, sy + 8, 3, th - 14);
        ctx.fillRect(sx + tw - 11, sy + 8, 3, th - 14);
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(cx - 3, sy + th - 10, 6, 6);
        break;
      }
      case BuildingType.TEMPLE: {
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(sx + 4, sy + 10, tw - 8, th - 14);
        ctx.fillStyle = '#F5F5F5';
        for (let i = -8; i <= 8; i += 5) {
          ctx.fillRect(cx + i - 1, sy + 4, 3, 8);
        }
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy + 6); ctx.lineTo(cx, sy + 2); ctx.lineTo(sx + tw - 2, sy + 6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#D0D0D0';
        ctx.fillRect(sx + 4, sy + th - 6, tw - 8, 3);
        break;
      }
      case BuildingType.GARDEN: {
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(sx + 2, sy + 2, tw - 4, th - 4);
        const flowerColors = ['#ff6b8a', '#ffb347', '#ff69b4', '#fff44f', '#ff4444'];
        const flowerSeed = (tile.x * 17 + tile.y * 31) % 100;
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = flowerColors[(flowerSeed + i * 7) % flowerColors.length];
          const fx = sx + 6 + ((flowerSeed + i * 13) % (tw - 12));
          const fy = sy + 6 + ((flowerSeed + i * 9) % (th - 12));
          ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case BuildingType.GUARD_TOWER: {
        ctx.fillStyle = '#696969';
        ctx.fillRect(cx - 6, sy + 8, 12, th - 12);
        ctx.fillStyle = '#555555';
        ctx.fillRect(cx - 9, sy + th - 6, 18, 4);
        ctx.fillStyle = '#888888';
        ctx.fillRect(cx - 8, sy + 4, 16, 6);
        ctx.fillStyle = '#696969';
        for (let i = -7; i <= 7; i += 4) {
          ctx.fillRect(cx + i, sy + 1, 2, 4);
        }
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(cx - 2, sy + 14, 4, 4);
        break;
      }
      case BuildingType.FIRE_STATION: {
        // Main building
        ctx.fillStyle = '#CC3333';
        ctx.fillRect(sx + 3, sy + 6, tw - 6, th - 9);
        // Roof
        ctx.fillStyle = '#991111';
        ctx.fillRect(sx + 1, sy + 2, tw - 2, 6);
        // Garage doors (2 bays)
        ctx.fillStyle = '#333333';
        ctx.fillRect(sx + 6, sy + th - 14, 8, 10);
        ctx.fillRect(sx + tw - 14, sy + th - 14, 8, 10);
        // Garage door lines
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
          const gy = sy + th - 12 + i * 3;
          ctx.beginPath(); ctx.moveTo(sx + 6, gy); ctx.lineTo(sx + 14, gy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx + tw - 14, gy); ctx.lineTo(sx + tw - 6, gy); ctx.stroke();
        }
        // Bell tower
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(cx - 3, sy + 8, 6, 8);
        // Bell
        const bellSwing = Math.sin(this.animTime * 3) * 0.15;
        ctx.save();
        ctx.translate(cx, sy + 16);
        ctx.rotate(bellSwing);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Range indicator glow
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin(this.animTime * 2) * 0.05;
        ctx.fillStyle = '#ff4444';
        ctx.beginPath(); ctx.arc(cx, cy, tw / 2 + 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        break;
      }
    }
  }

  private drawBridge(sx: number, sy: number, tw: number, th: number): void {
    const ctx = this.ctx;
    const plankColor = '#8B7355';
    const plankDark = '#6B5535';
    const plankCount = 4;
    const plankHeight = (th - 8) / plankCount;

    ctx.fillStyle = '#5a4030';
    ctx.fillRect(sx + 2, sy + 2, tw - 4, th - 4);
    for (let i = 0; i < plankCount; i++) {
      const py = sy + 4 + i * plankHeight;
      ctx.fillStyle = i % 2 === 0 ? plankColor : plankDark;
      ctx.fillRect(sx + 4, py, tw - 8, plankHeight - 1);
    }
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(sx + 2, sy + 2, 3, th - 4);
    ctx.fillRect(sx + tw - 5, sy + 2, 3, th - 4);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < plankCount; i++) {
      const py = sy + 4 + i * plankHeight;
      ctx.beginPath(); ctx.moveTo(sx + 6, py + plankHeight / 2); ctx.lineTo(sx + tw - 6, py + plankHeight / 2); ctx.stroke();
    }
  }

  screenToTile(screenX: number, screenY: number, cameraX: number, cameraY: number, zoom: number): { x: number; y: number } | null {
    const worldX = (screenX - this.width / 2 - cameraX) / zoom;
    const worldY = (screenY - this.height / 2 - cameraY) / zoom;
    const halfMapW = (MAP_SIZE * TILE_WIDTH) / 2;
    const halfMapH = (MAP_SIZE * TILE_HEIGHT) / 2;
    const tileX = Math.floor((worldX + halfMapW) / TILE_WIDTH);
    const tileY = Math.floor((worldY + halfMapH) / TILE_HEIGHT);
    if (tileX < 0 || tileX >= MAP_SIZE || tileY < 0 || tileY >= MAP_SIZE) return null;
    return { x: tileX, y: tileY };
  }
}

// ===== Helper: check road access for renderer (duplicated to avoid circular imports) =====
function isRoadExempt(building: BuildingType): boolean {
  return building === BuildingType.FARM ||
         building === BuildingType.WELL ||
         building === BuildingType.ROAD ||
         building === BuildingType.BRIDGE ||
         building === BuildingType.GARDEN;
}

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

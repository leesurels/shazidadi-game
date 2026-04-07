// ===== 傻子大帝 - Game Loop =====
import { useGameStore } from './store';
import { Renderer } from './renderer';
import { InputHandler } from './inputHandler';
import { BUILDING_DEFS } from './constants';
import { BuildingType } from './types';
import type { RenderState } from './types';

export class GameLoop {
  private renderer: Renderer;
  private inputHandler: InputHandler;
  private animFrameId: number | null = null;
  private lastTickTime: number = 0;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(renderer: Renderer, inputHandler: InputHandler) {
    this.renderer = renderer;
    this.inputHandler = inputHandler;
  }

  start(): void {
    this.lastTickTime = performance.now();

    // Start auto-save
    this.autoSaveTimer = setInterval(() => {
      useGameStore.getState().saveGame();
    }, 30000);

    // Start render loop
    this.loop();
  }

  stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private loop = (): void => {
    const state = useGameStore.getState();

    // Game tick based on speed
    const now = performance.now();
    if (state.isRunning && state.gameSpeed > 0) {
      const tickInterval = [0, 1000, 500, 333][state.gameSpeed] || 1000;
      if (now - this.lastTickTime >= tickInterval) {
        state.gameTick();
        this.lastTickTime = now;
      }
    }

    // Render every frame
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private render(): void {
    const state = useGameStore.getState();
    if (state.showStartScreen) return;

    const highlightedTile = this.inputHandler.getHighlightedTile();

    // Build render state
    const renderState: RenderState = {
      highlightedTile,
      buildingRangePreview: null,
      demolishPreview: state.isDemolishMode,
      animationTime: performance.now() / 1000,
      pedestrians: state.pedestrians || [],
    };

    // Show range preview when selecting a service building and hovering
    if (highlightedTile && state.selectedBuilding && state.selectedBuilding !== BuildingType.DEMOLISH) {
      const def = BUILDING_DEFS[state.selectedBuilding];
      if (def && def.range) {
        renderState.buildingRangePreview = {
          x: highlightedTile.x,
          y: highlightedTile.y,
          range: def.range,
        };
      }
    }

    // Also show range when viewing an existing building
    if (highlightedTile && !state.selectedBuilding && !state.isDemolishMode && state.selectedTile) {
      const tile = state.map[state.selectedTile.y]?.[state.selectedTile.x];
      if (tile && tile.building) {
        const def = BUILDING_DEFS[tile.building];
        if (def && def.range) {
          renderState.buildingRangePreview = {
            x: state.selectedTile.x,
            y: state.selectedTile.y,
            range: def.range,
          };
        }
      }
    }

    this.renderer.render(
      state.map,
      state.cameraX,
      state.cameraY,
      state.zoom,
      renderState,
      state.selectedBuilding,
      state.isDemolishMode
    );
  }
}

// ===== 傻子大帝 - Input Handler (Touch & Mouse) =====
import { Renderer } from './renderer';
import { useGameStore } from './store';
import { BuildingType } from './types';
import { TAP_THRESHOLD, LONG_PRESS_DURATION, MIN_ZOOM, MAX_ZOOM } from './constants';

export class InputHandler {
  private renderer: Renderer;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private touchStartTime = 0;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private initialPinchDistance = 0;
  private initialPinchZoom = 1;
  private canvasEl: HTMLCanvasElement;

  constructor(renderer: Renderer, canvasEl: HTMLCanvasElement) {
    this.renderer = renderer;
    this.canvasEl = canvasEl;
    this.bindEvents();
  }

  private getStore() {
    return useGameStore.getState();
  }

  private bindEvents(): void {
    // Mouse events
    this.canvasEl.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.canvasEl.addEventListener('wheel', this.onWheel, { passive: false });

    // Touch events
    this.canvasEl.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvasEl.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvasEl.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.canvasEl.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }

  destroy(): void {
    this.canvasEl.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.canvasEl.removeEventListener('wheel', this.onWheel);
    this.canvasEl.removeEventListener('touchstart', this.onTouchStart);
    this.canvasEl.removeEventListener('touchmove', this.onTouchMove);
    this.canvasEl.removeEventListener('touchend', this.onTouchEnd);
    this.canvasEl.removeEventListener('touchcancel', this.onTouchEnd);
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
  }

  // ===== Mouse Events =====
  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.lastTouchX = e.clientX;
    this.lastTouchY = e.clientY;
    this.isDragging = false;
    this.touchStartTime = Date.now();

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(e.clientX, e.clientY);
    }, LONG_PRESS_DURATION);
  };

  private onMouseMove = (e: MouseEvent): void => {
    const state = this.getStore();
    const rect = this.canvasEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update highlighted tile
    const tile = this.renderer.screenToTile(mouseX, mouseY, state.cameraX, state.cameraY, state.zoom);
    this.updateHighlight(tile);

    // Check if dragging
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) {
      this.isDragging = true;
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }

    if (this.isDragging) {
      const moveX = e.clientX - this.lastTouchX;
      const moveY = e.clientY - this.lastTouchY;
      state.setCamera(state.cameraX + moveX, state.cameraY + moveY);
      this.lastTouchX = e.clientX;
      this.lastTouchY = e.clientY;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (!this.isDragging) {
      const rect = this.canvasEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.handleTap(mouseX, mouseY);
    }
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const state = this.getStore();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    state.setZoom(state.zoom + delta);
  };

  // ===== Touch Events =====
  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.dragStartX = touch.clientX;
      this.dragStartY = touch.clientY;
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
      this.isDragging = false;
      this.touchStartTime = Date.now();

      // Long press timer
      this.longPressTimer = setTimeout(() => {
        this.handleLongPress(touch.clientX, touch.clientY);
      }, LONG_PRESS_DURATION);
    } else if (e.touches.length === 2) {
      // Pinch start
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      this.isDragging = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      this.initialPinchZoom = this.getStore().zoom;
      this.lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      this.lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    const state = this.getStore();

    if (e.touches.length === 1 && !this.isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - this.dragStartX;
      const dy = touch.clientY - this.dragStartY;

      if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) {
        this.isDragging = true;
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }

      if (this.isDragging) {
        const moveX = touch.clientX - this.lastTouchX;
        const moveY = touch.clientY - this.lastTouchY;
        state.setCamera(state.cameraX + moveX, state.cameraY + moveY);
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
      }

      // Update highlighted tile
      const rect = this.canvasEl.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      const tile = this.renderer.screenToTile(mouseX, mouseY, state.cameraX, state.cameraY, state.zoom);
      this.updateHighlight(tile);
    } else if (e.touches.length === 1 && this.isDragging) {
      const touch = e.touches[0];
      const moveX = touch.clientX - this.lastTouchX;
      const moveY = touch.clientY - this.lastTouchY;
      state.setCamera(state.cameraX + moveX, state.cameraY + moveY);
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
    } else if (e.touches.length === 2) {
      // Pinch zoom + pan
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / Math.max(1, this.initialPinchDistance);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.initialPinchZoom * scale));
      state.setZoom(newZoom);

      // Pan
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const moveX = centerX - this.lastTouchX;
      const moveY = centerY - this.lastTouchY;
      state.setCamera(state.cameraX + moveX, state.cameraY + moveY);
      this.lastTouchX = centerX;
      this.lastTouchY = centerY;
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (!this.isDragging && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const rect = this.canvasEl.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      this.handleTap(mouseX, mouseY);
    }
    this.isDragging = false;
  };

  // ===== Actions =====
  private handleTap(screenX: number, screenY: number): void {
    const state = this.getStore();
    const tile = this.renderer.screenToTile(screenX, screenY, state.cameraX, state.cameraY, state.zoom);
    if (!tile) return;

    const mapTile = state.map[tile.y]?.[tile.x];
    if (!mapTile) return;

    // Demolish mode
    if (state.isDemolishMode) {
      if (mapTile.building) {
        state.demolishBuilding(tile.x, tile.y);
      }
      return;
    }

    // If a building is selected, try to place it
    if (state.selectedBuilding && state.selectedBuilding !== BuildingType.DEMOLISH) {
      const success = state.placeBuilding(tile.x, tile.y);
      if (success) {
        // Keep building selected for rapid placement
      }
      return;
    }

    // Otherwise, select the tile (show info if there's a building)
    state.setSelectedTile(tile);
  }

  private handleLongPress(clientX: number, clientY: number): void {
    const state = this.getStore();
    const rect = this.canvasEl.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const tile = this.renderer.screenToTile(mouseX, mouseY, state.cameraX, state.cameraY, state.zoom);
    if (!tile) return;

    const mapTile = state.map[tile.y]?.[tile.x];
    if (mapTile && mapTile.building) {
      state.setSelectedTile(tile);
    }
  }

  private updateHighlight(tile: { x: number; y: number } | null): void {
    this._highlightedTile = tile;
  }

  // Public getter for highlighted tile (used by render loop)
  _highlightedTile: { x: number; y: number } | null = null;
  getHighlightedTile(): { x: number; y: number } | null {
    return this._highlightedTile;
  }
}

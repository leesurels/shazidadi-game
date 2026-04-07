'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { BUILDING_DEFS, BUILD_ORDER } from '@/game/constants';
import { BuildingType } from '@/game/types';

export default function BuildBar() {
  const {
    selectedBuilding,
    isDemolishMode,
    selectBuilding,
    toggleDemolishMode,
    resources,
    setShowBuildingInfo,
    setSelectedTile,
  } = useGameStore();

  return (
    <div
      className="shrink-0"
      style={{
        background: 'linear-gradient(to top, #1a0a00, #150800)',
        borderTop: '1px solid rgba(218,165,32,0.3)',
      }}
    >
      {/* Building buttons */}
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
        {BUILD_ORDER.map(type => {
          const def = BUILDING_DEFS[type];
          if (!def) return null;
          const isSelected = selectedBuilding === type && !isDemolishMode;
          const canAfford =
            resources.gold >= def.cost.gold &&
            resources.wood >= def.cost.wood &&
            resources.stone >= def.cost.stone;

          return (
            <button
              key={type}
              onClick={() => {
                if (isSelected) {
                  selectBuilding(null);
                  setShowBuildingInfo(false);
                  setSelectedTile(null);
                } else {
                  selectBuilding(type);
                }
              }}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 transition-all active:scale-90 min-w-[48px]"
              style={{
                background: isSelected
                  ? 'rgba(218,165,32,0.3)'
                  : 'rgba(255,255,255,0.05)',
                border: isSelected
                  ? '2px solid #FFD700'
                  : '1px solid rgba(255,255,255,0.1)',
                opacity: canAfford ? 1 : 0.5,
              }}
              title={`${def.name} (💰${def.cost.gold} 🪵${def.cost.wood} 🪨${def.cost.stone})`}
            >
              <span className="text-xl leading-none">{def.emoji}</span>
              <span
                className="text-[10px] leading-tight"
                style={{ color: isSelected ? '#FFD700' : '#ccc' }}
              >
                {def.name}
              </span>
            </button>
          );
        })}

        {/* Demolish button */}
        <button
          onClick={toggleDemolishMode}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 transition-all active:scale-90 min-w-[48px]"
          style={{
            background: isDemolishMode
              ? 'rgba(255,50,50,0.3)'
              : 'rgba(255,255,255,0.05)',
            border: isDemolishMode
              ? '2px solid #ff3333'
              : '1px solid rgba(255,255,255,0.1)',
          }}
          title="拆除建筑"
        >
          <span className="text-xl leading-none">💥</span>
          <span
            className="text-[10px] leading-tight"
            style={{ color: isDemolishMode ? '#ff3333' : '#ccc' }}
          >
            拆除
          </span>
        </button>
      </div>

      {/* Current selection indicator */}
      {(selectedBuilding || isDemolishMode) && (
        <div className="px-3 pb-1.5">
          <span className="text-xs" style={{ color: '#999' }}>
            {isDemolishMode
              ? '👆 点击建筑进行拆除 (返还50%金币)'
              : selectedBuilding
                ? (() => {
                    const def = BUILDING_DEFS[selectedBuilding];
                    return def
                      ? `当前: ${def.emoji} ${def.name} (💰${def.cost.gold} 🪵${def.cost.wood} 🪨${def.cost.stone})`
                      : '';
                  })()
                : ''}
          </span>
        </div>
      )}
    </div>
  );
}

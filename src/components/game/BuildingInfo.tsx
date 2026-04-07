'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { BUILDING_DEFS } from '@/game/constants';
import { BuildingType } from '@/game/types';

export default function BuildingInfo() {
  const {
    showBuildingInfo,
    selectedTile,
    map,
    setShowBuildingInfo,
    setSelectedTile,
    setShowMarketTrade,
    demolishBuilding,
    population,
    workersNeeded,
    storageCapacity,
  } = useGameStore();

  if (!showBuildingInfo || !selectedTile) return null;

  const tile = map[selectedTile.y]?.[selectedTile.x];
  if (!tile || !tile.building) return null;

  const def = BUILDING_DEFS[tile.building];
  if (!def) return null;

  const refundGold = Math.floor(def.cost.gold * 0.5);
  const workerEff = workersNeeded > 0 ? Math.min(1, population / workersNeeded) : 1;
  const workerPercent = Math.round(workerEff * 100);
  const goldCap = storageCapacity * 5;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center"
      onClick={() => {
        setShowBuildingInfo(false);
        setSelectedTile(null);
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative w-72 rounded-xl p-4 mx-4 max-h-[85vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(to bottom, #2a1500, #1a0a00)',
          border: '1px solid rgba(218,165,32,0.4)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{def.emoji}</span>
            <div>
              <h3 className="text-base font-bold" style={{ color: '#FFD700' }}>
                {def.name}
              </h3>
              <p className="text-[10px]" style={{ color: '#888' }}>
                坐标 ({selectedTile.x}, {selectedTile.y})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowBuildingInfo(false);
              setSelectedTile(null);
            }}
            className="text-gray-400 text-lg px-1 active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          {/* Production */}
          {def.production && Object.keys(def.production).length > 0 && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>产出</p>
              {def.production.food && (
                <p className="text-xs" style={{ color: '#ccc' }}>🍞 食物 +{def.production.food}/回合</p>
              )}
              {def.production.wood && (
                <p className="text-xs" style={{ color: '#ccc' }}>🪵 木材 +{def.production.wood}/回合</p>
              )}
              {def.production.stone && (
                <p className="text-xs" style={{ color: '#ccc' }}>🪨 石材 +{def.production.stone}/回合</p>
              )}
              {def.production.pottery && (
                <p className="text-xs" style={{ color: '#ccc' }}>🏺 陶器 +{def.production.pottery}/回合 (消耗1石材)</p>
              )}
            </div>
          )}

          {/* Workers needed */}
          {(def.workersNeeded || 0) > 0 && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>👷 工人需求</p>
              <p className="text-xs" style={{ color: '#ccc' }}>
                需要 {def.workersNeeded} 名工人
              </p>
              <p className="text-[10px] mt-0.5" style={{
                color: workerPercent >= 100 ? '#66cc66' : workerPercent >= 70 ? '#ffcc00' : '#ff6666'
              }}>
                当前效率: {workerPercent}% {workerPercent >= 100 ? '✅' : '⚠️人手不足'}
              </p>
              <p className="text-[10px]" style={{ color: '#888' }}>
                人口不足时产出按比例降低
              </p>
            </div>
          )}

          {/* Warehouse storage info */}
          {tile.building === 'warehouse' && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>📦 仓储功能</p>
              <p className="text-xs" style={{ color: '#ccc' }}>
                增加资源储存上限 +150
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#aaa' }}>
                当前容量: {storageCapacity} (金币: {goldCap})
              </p>
              <p className="text-[10px]" style={{ color: '#888' }}>
                陶器工坊需在仓库范围内
              </p>
            </div>
          )}

          {/* Happiness bonus */}
          {(def.happinessBonus || 0) > 0 && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>幸福加成</p>
              <p className="text-xs" style={{ color: '#ccc' }}>😊 +{def.happinessBonus} (范围: {def.range}格)</p>
            </div>
          )}

          {/* Market special */}
          {tile.building === 'market' && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>💰 贸易功能</p>
              <p className="text-xs" style={{ color: '#ccc' }}>买卖食物、木材、石材、陶器</p>
              <p className="text-[10px]" style={{ color: '#aaa' }}>需要道路连接</p>
              <button
                onClick={() => {
                  setShowBuildingInfo(false);
                  setSelectedTile(null);
                  setShowMarketTrade(true);
                }}
                className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(to bottom, #B8860B, #8B6914)',
                  color: '#FFD700',
                  border: '1px solid rgba(218,165,32,0.4)',
                }}
              >
                🏪 打开交易面板
              </button>
            </div>
          )}

          {/* Guard tower special */}
          {tile.building === 'guard_tower' && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>🗼 防御功能</p>
              <p className="text-xs" style={{ color: '#ccc' }}>减少蛮族入侵伤亡25%/塔</p>
              <p className="text-xs" style={{ color: '#aaa' }}>每塔20%概率击退入侵者</p>
              <p className="text-xs" style={{ color: '#aaa' }}>安全加成: 每塔+3幸福度</p>
            </div>
          )}

          {/* Fire station special */}
          {tile.building === 'fire_station' && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>🚒 消防功能</p>
              <p className="text-xs" style={{ color: '#ccc' }}>保护范围{BUILDING_DEFS[BuildingType.FIRE_STATION]?.range || 6}格内建筑免受火灾</p>
              <p className="text-xs" style={{ color: '#aaa' }}>消防员自动沿道路巡逻</p>
              <p className="text-xs" style={{ color: '#888' }}>需要道路连接</p>
            </div>
          )}

          {/* House special */}
          {tile.building === 'house' && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>功能</p>
              <p className="text-xs" style={{ color: '#ccc' }}>👥 容纳{def.populationCapacity}人口</p>
              <p className="text-xs" style={{ color: '#aaa' }}>等级: {tile.houseLevel}/4</p>
            </div>
          )}

          {/* Tax office special */}
          {tile.building === 'tax_office' && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: '#DAA520' }}>功能</p>
              <p className="text-xs" style={{ color: '#ccc' }}>💰 每10人口收税5金币 (范围: 5格)</p>
              <p className="text-xs" style={{ color: '#aaa' }}>需要1名工人 + 道路连接</p>
            </div>
          )}

          {/* Cost */}
          <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs mb-1" style={{ color: '#DAA520' }}>建造成本</p>
            <p className="text-xs" style={{ color: '#ccc' }}>
              💰{def.cost.gold} 🪵{def.cost.wood} 🪨{def.cost.stone}
            </p>
          </div>

          {/* Desirability */}
          <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs mb-1" style={{ color: '#DAA520' }}>环境影响</p>
            <p className="text-xs" style={{ color: '#ccc' }}>
              地块吸引力: {tile.desirability > 0 ? '+' : ''}{tile.desirability}
            </p>
          </div>
        </div>

        {/* Demolish button */}
        <button
          onClick={() => {
            demolishBuilding(selectedTile.x, selectedTile.y);
          }}
          className="w-full py-2 rounded-lg text-sm font-bold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(to bottom, #8B0000, #600000)',
            color: '#ff6666',
            border: '1px solid rgba(255,0,0,0.3)',
          }}
        >
          💥 拆除 (返还💰{refundGold})
        </button>
      </div>
    </div>
  );
}

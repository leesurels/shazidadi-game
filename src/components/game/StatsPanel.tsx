'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { BUILDING_DEFS, VICTORY_TIERS } from '@/game/constants';

export default function StatsPanel() {
  const {
    showStatsPanel,
    setShowStatsPanel,
    population,
    maxPopulation,
    happiness,
    resources,
    tickCount,
    currentRank,
    storageCapacity,
    getProductionRates,
    getBuildingCounts,
  } = useGameStore();

  if (!showStatsPanel) return null;

  const rates = getProductionRates();
  const buildingCounts = getBuildingCounts();
  const totalBuildings = Object.values(buildingCounts).reduce((a, b) => a + b, 0);
  const gameTime = tickCount; // ticks

  // Format time
  const hours = Math.floor(gameTime / 3600);
  const minutes = Math.floor((gameTime % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}时${minutes}分` : `${minutes}分`;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      onClick={() => setShowStatsPanel(false)}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-t-2xl p-4 pb-6 max-h-[70vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(to bottom, #2a1500, #1a0a00)',
          borderTop: '2px solid rgba(218,165,32,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold"
            style={{ color: '#FFD700', fontFamily: 'serif' }}
          >
            📊 城市统计
          </h2>
          <button
            onClick={() => setShowStatsPanel(false)}
            className="text-gray-400 text-xl px-2 active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* City info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard label="🏆 头衔" value={currentRank} />
          <StatCard label="👥 人口" value={`${population} / ${maxPopulation}`} />
          <StatCard label="😊 幸福度" value={`${happiness}%`} />
          <StatCard label="⏱️ 游戏时间" value={timeStr} />
          <StatCard label="🏗️ 建筑数" value={`${totalBuildings}`} />
          <StatCard label="📦 仓库容量" value={`${storageCapacity}`} />
          <StatCard label="👷 工人" value={`${rates.workersNeeded > 0 ? Math.min(population, rates.workersNeeded) : 0}/${rates.workersNeeded}`} />
          <StatCard label="⚡ 工作效率" value={`${Math.round(rates.workerEfficiency * 100)}%`} />
        </div>

        {/* Resources */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: '#DAA520' }}>
            📦 资源
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <ResourceRow emoji="🍞" name="食物" amount={Math.floor(resources.food)} rate={rates.food} />
            <ResourceRow emoji="🪵" name="木材" amount={Math.floor(resources.wood)} rate={rates.wood} />
            <ResourceRow emoji="🪨" name="石材" amount={Math.floor(resources.stone)} rate={rates.stone} />
            <ResourceRow emoji="🏺" name="陶器" amount={Math.floor(resources.pottery)} rate={rates.pottery} />
            <ResourceRow emoji="💰" name="金币" amount={Math.floor(resources.gold)} rate={rates.gold} />
          </div>
        </div>

        {/* Production rates */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: '#DAA520' }}>
            📈 每回合产出
          </h3>
          <div className="text-xs space-y-1" style={{ color: '#ccc' }}>
            <p>🍞 食物: +{rates.food} | 消耗: -{(population * 0.5).toFixed(1)}</p>
            <p>🪵 木材: +{rates.wood}</p>
            <p>🪨 石材: +{rates.stone}</p>
            <p>🏺 陶器: +{rates.pottery}</p>
            <p>💰 金币: +{rates.gold}</p>
            <p style={{ color: rates.workerEfficiency < 1 ? '#ff9944' : '#888' }}>
              👷 工人效率: {Math.round(rates.workerEfficiency * 100)}% {rates.workerEfficiency < 1 ? '(人手不足!)' : ''}
            </p>
          </div>
        </div>

        {/* Building counts */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: '#DAA520' }}>
            🏗️ 建筑统计
          </h3>
          <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: '#ccc' }}>
            {Object.entries(buildingCounts)
              .filter(([, count]) => count > 0)
              .map(([type, count]) => {
                const def = BUILDING_DEFS[type];
                return def ? (
                  <div key={type} className="flex items-center gap-1">
                    <span>{def.emoji}</span>
                    <span>{def.name}</span>
                    <span style={{ color: '#FFD700' }}>x{count}</span>
                  </div>
                ) : null;
              })}
            {Object.keys(buildingCounts).length === 0 && (
              <p className="col-span-2 text-gray-500">还没有建造任何建筑</p>
            )}
          </div>
        </div>

        {/* Victory progress */}
        <div>
          <h3 className="text-sm font-bold mb-2" style={{ color: '#DAA520' }}>
            🏆 晋升进度
          </h3>
          <div className="space-y-2">
            {VICTORY_TIERS.map(tier => {
              const achieved = population >= tier.population;
              const progress = Math.min(100, (population / tier.population) * 100);
              return (
                <div key={tier.name}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span style={{ color: achieved ? '#FFD700' : '#999' }}>
                      {tier.emoji} {tier.name}
                    </span>
                    <span style={{ color: achieved ? '#FFD700' : '#666' }}>
                      {population}/{tier.population}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        background: achieved
                          ? 'linear-gradient(to right, #DAA520, #FFD700)'
                          : 'rgba(218,165,32,0.4)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-2.5"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      <div className="text-[10px] mb-0.5" style={{ color: '#888' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: '#FFD700' }}>{value}</div>
    </div>
  );
}

function ResourceRow({ emoji, name, amount, rate }: { emoji: string; name: string; amount: number; rate: number }) {
  return (
    <div
      className="flex items-center justify-between rounded-md px-2 py-1"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-1">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs" style={{ color: '#ccc' }}>{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: '#FFD700' }}>{amount}</span>
        {rate > 0 && (
          <span className="text-[10px]" style={{ color: '#4ade80' }}>+{rate}</span>
        )}
      </div>
    </div>
  );
}

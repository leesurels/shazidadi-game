'use client';

import React from 'react';
import { useGameStore } from '@/game/store';

const RESOURCE_ITEMS = [
  { key: 'food' as const, emoji: '🍞', name: '食物' },
  { key: 'wood' as const, emoji: '🪵', name: '木材' },
  { key: 'stone' as const, emoji: '🪨', name: '石材' },
  { key: 'pottery' as const, emoji: '🏺', name: '陶器' },
  { key: 'gold' as const, emoji: '💰', name: '金币' },
];

export default function ResourceBar() {
  const resources = useGameStore(s => s.resources);
  const storageCapacity = useGameStore(s => s.storageCapacity);
  const workersNeeded = useGameStore(s => s.workersNeeded);
  const workersAvailable = useGameStore(s => s.workersAvailable);
  const population = useGameStore(s => s.population);
  const hasRunningGame = useGameStore(s => s.isRunning);

  const goldCap = storageCapacity * 5;
  const workerPercent = workersNeeded > 0 ? Math.min(100, Math.round((population / workersNeeded) * 100)) : 100;
  const workerColor = workerPercent >= 100 ? '#66cc66' : workerPercent >= 70 ? '#ffcc00' : '#ff6666';

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-1 overflow-x-auto shrink-0"
      style={{
        background: 'linear-gradient(to bottom, #1a0a00, #150800)',
        borderBottom: '1px solid rgba(218,165,32,0.2)',
      }}
    >
      {/* Worker indicator */}
      {hasRunningGame && population > 0 && (
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          title={`工人: ${Math.min(population, workersNeeded)}/${workersNeeded} 效率${workerPercent}%`}
        >
          <span className="text-xs">👷</span>
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: workerColor }}
          >
            {workerPercent}%
          </span>
        </div>
      )}

      {/* Storage indicator */}
      {hasRunningGame && (
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          title={`仓储容量: ${storageCapacity} (金币: ${goldCap})`}
        >
          <span className="text-xs">📦</span>
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: '#DAA520' }}
          >
            {storageCapacity}
          </span>
        </div>
      )}

      {/* Divider */}
      {hasRunningGame && population > 0 && (
        <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
      )}

      {RESOURCE_ITEMS.map(item => {
        const cap = item.key === 'gold' ? goldCap : storageCapacity;
        const isNearCap = resources[item.key] >= cap * 0.9;
        return (
          <div
            key={item.key}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
            style={{
              background: 'rgba(255,255,255,0.05)',
            }}
            title={`${item.name}: ${Math.floor(resources[item.key])}/${cap}`}
          >
            <span className="text-sm">{item.emoji}</span>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: isNearCap ? '#ff9944' : '#FFD700' }}
            >
              {Math.floor(resources[item.key])}
            </span>
          </div>
        );
      })}
    </div>
  );
}

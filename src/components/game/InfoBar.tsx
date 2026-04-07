'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { GameEventType } from '@/game/types';

const ACTIVE_EVENT_DISPLAY: Record<string, { emoji: string; label: string }> = {
  [GameEventType.PLAGUE]: { emoji: '😷', label: '瘟疫' },
  [GameEventType.BARBARIAN]: { emoji: '⚔️', label: '蛮族入侵' },
  [GameEventType.FIRE]: { emoji: '🔥', label: '火灾' },
  [GameEventType.EARTHQUAKE]: { emoji: '💥', label: '地震' },
};

export default function InfoBar() {
  const { population, maxPopulation, happiness, gameSpeed, togglePause, activeEvents } = useGameStore();

  const speedEmoji = ['⏸️', '▶️', '▶▶', '▶▶▶'][gameSpeed] ?? '▶️';
  const speedLabel = ['暂停', '1x', '2x', '3x'][gameSpeed] ?? '1x';

  const happinessEmoji = happiness >= 70 ? '😊' : happiness >= 40 ? '😐' : '😟';

  // Display active bad events
  const displayEvents = activeEvents.filter(e =>
    ACTIVE_EVENT_DISPLAY[e.type]
  );

  return (
    <div
      className="shrink-0"
      style={{
        background: 'linear-gradient(to bottom, #1a0a00, #0a0500)',
        borderTop: '1px solid rgba(218,165,32,0.2)',
      }}
    >
      {/* Active event indicator */}
      {displayEvents.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-1" style={{
          background: 'rgba(255,50,50,0.15)',
          borderBottom: '1px solid rgba(255,50,50,0.2)',
        }}>
          {displayEvents.map((evt, i) => {
            const display = ACTIVE_EVENT_DISPLAY[evt.type];
            return (
              <span key={`active-event-${i}`} className="text-[10px] font-bold" style={{ color: '#ef4444' }}>
                {display.emoji} {display.label}
                {evt.remainingTicks !== undefined && evt.remainingTicks > 0 && (
                  <span style={{ color: '#999' }}> ({evt.remainingTicks})</span>
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2">
        {/* Population */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm">👥</span>
          <span className="text-xs font-bold" style={{ color: '#FFD700' }}>
            {population}
          </span>
          <span className="text-xs" style={{ color: '#888' }}>/</span>
          <span className="text-xs" style={{ color: '#aaa' }}>
            {maxPopulation}
          </span>
        </div>

        {/* Happiness */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{happinessEmoji}</span>
          <span className="text-xs font-bold" style={{ color: '#FFD700' }}>
            {happiness}%
          </span>
        </div>

        {/* Speed control */}
        <button
          onClick={togglePause}
          className="flex items-center gap-1 px-2 py-0.5 rounded transition-all active:scale-90"
          style={{
            background: 'rgba(255,255,255,0.1)',
          }}
        >
          <span className="text-sm">{speedEmoji}</span>
          <span className="text-xs" style={{ color: '#ccc' }}>
            {speedLabel}
          </span>
        </button>
      </div>
    </div>
  );
}

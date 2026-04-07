'use client';

import React from 'react';
import { useGameStore } from '@/game/store';

export default function VictoryModal() {
  const { victoryNotification, setVictoryNotification } = useGameStore();

  if (!victoryNotification) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => setVictoryNotification(null)}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div
        className="relative w-80 rounded-2xl p-6 text-center mx-4 animate-bounce"
        style={{
          background: 'linear-gradient(to bottom, #3a2500, #1a0a00)',
          border: '2px solid #FFD700',
          boxShadow: '0 0 40px rgba(255,215,0,0.3), 0 8px 32px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Celebration emoji */}
        <div className="text-5xl mb-3">🎉</div>

        {/* Message */}
        <h2
          className="text-2xl font-bold mb-2"
          style={{
            color: '#FFD700',
            fontFamily: 'serif',
            textShadow: '0 0 10px rgba(255,215,0,0.5)',
          }}
        >
          {victoryNotification}
        </h2>

        <p className="text-sm mb-4" style={{ color: '#DAA520' }}>
          你的城市正在蓬勃发展！
        </p>

        <button
          onClick={() => setVictoryNotification(null)}
          className="px-6 py-2 rounded-lg font-bold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(to bottom, #DAA520, #B8860B)',
            color: '#1a0a00',
          }}
        >
          继续建设
        </button>
      </div>
    </div>
  );
}

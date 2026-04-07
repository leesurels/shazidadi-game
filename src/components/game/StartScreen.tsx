'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { SAVE_KEY } from '@/game/constants';

export default function StartScreen() {
  const { startNewGame, loadGame } = useGameStore();
  const [hasSave, setHasSave] = React.useState(false);

  React.useEffect(() => {
    setHasSave(!!localStorage.getItem(SAVE_KEY));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#1a0a00] via-[#2a1500] to-[#0a0500]">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,215,0,0.1) 35px, rgba(255,215,0,0.1) 36px)',
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-6xl sm:text-7xl">👑</div>
          <h1
            className="text-5xl sm:text-6xl font-bold tracking-wider"
            style={{
              color: '#FFD700',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.3)',
              fontFamily: 'serif',
            }}
          >
            傻子大帝
          </h1>
          <p
            className="text-lg sm:text-xl tracking-widest"
            style={{
              color: '#DAA520',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            建造你的罗马帝国
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#DAA520]" />
          <span className="text-2xl">🏛️</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#DAA520]" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-64">
          <button
            onClick={startNewGame}
            className="px-6 py-3 rounded-lg text-lg font-bold transition-all active:scale-95"
            style={{
              background: 'linear-gradient(to bottom, #DAA520, #B8860B)',
              color: '#1a0a00',
              border: '2px solid #FFD700',
              boxShadow: '0 4px 12px rgba(218,165,32,0.4)',
            }}
          >
            开始新游戏
          </button>

          {hasSave && (
            <button
              onClick={() => loadGame()}
              className="px-6 py-3 rounded-lg text-lg font-bold transition-all active:scale-95"
              style={{
                background: 'linear-gradient(to bottom, #555, #333)',
                color: '#FFD700',
                border: '2px solid #666',
              }}
            >
              继续游戏
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-4">
          触屏拖动移动地图 · 双指缩放 · 点击建造
        </p>
        <p className="text-xs text-gray-600">
          60x60 俯瞰视角 · 注意随机事件！
        </p>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { openEventLog } from './EventLog';

export default function TopBar() {
  const { currentRank, setShowStatsPanel, notifications } = useGameStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      className="flex items-center justify-between px-3 py-2 shrink-0"
      style={{
        background: 'linear-gradient(to bottom, #2a1500, #1a0a00)',
        borderBottom: '1px solid rgba(218,165,32,0.3)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">👑</span>
        <span
          className="text-base font-bold tracking-wide"
          style={{
            color: '#FFD700',
            fontFamily: 'serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          傻子大帝
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Victory rank badge */}
        <div
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(218,165,32,0.2)',
            color: '#FFD700',
            border: '1px solid rgba(218,165,32,0.4)',
          }}
        >
          🏆 {currentRank}
        </div>

        {/* Notification bell */}
        <button
          onClick={openEventLog}
          className="relative p-1.5 rounded transition-colors active:scale-90"
          style={{ color: '#DAA520' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                background: '#ef4444',
                color: '#fff',
                padding: '0 3px',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Stats button */}
        <button
          onClick={() => setShowStatsPanel(true)}
          className="p-1.5 rounded transition-colors active:scale-90"
          style={{ color: '#DAA520' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

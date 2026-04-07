'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/game/store';
import type { GameNotification } from '@/game/types';

export default function NotificationBanner() {
  const notifications = useGameStore(s => s.notifications);
  const markNotificationRead = useGameStore(s => s.markNotificationRead);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<GameNotification | null>(null);
  const prevUnreadCountRef = useRef(0);

  const unreadCount = notifications.filter(n => !n.read).length;
  const latestUnread = notifications.find(n => !n.read) || null;

  useEffect(() => {
    // Only show banner when a NEW unread notification appears (count increased)
    if (unreadCount > prevUnreadCountRef.current && latestUnread) {
      const notif = latestUnread;

      // Use a timeout to avoid synchronous setState in effect
      const showTimer = setTimeout(() => {
        setCurrent(notif);
        setVisible(true);
      }, 0);

      // Auto dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        setVisible(false);
        markNotificationRead(notif.id);
      }, 5000);

      prevUnreadCountRef.current = unreadCount;

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimer);
      };
    }

    prevUnreadCountRef.current = unreadCount;
    return () => {};
  }, [unreadCount, latestUnread, markNotificationRead]);

  const handleDismiss = () => {
    setVisible(false);
    if (current) {
      markNotificationRead(current.id);
    }
  };

  if (!visible || !current) return null;

  const isGood = current.event.severity === 'good';
  const isBad = current.event.severity === 'bad';
  const borderColor = isGood ? '#4ade80' : isBad ? '#ef4444' : '#DAA520';
  const bgColor = isGood
    ? 'linear-gradient(to right, rgba(20,40,20,0.95), rgba(10,30,10,0.95))'
    : isBad
      ? 'linear-gradient(to right, rgba(40,15,15,0.95), rgba(30,10,10,0.95))'
      : 'linear-gradient(to right, rgba(30,25,10,0.95), rgba(20,15,5,0.95))';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 px-4 animate-slide-down"
    >
      <div
        className="w-full max-w-md rounded-xl p-3 shadow-2xl cursor-pointer active:scale-[0.98] transition-transform"
        style={{
          background: bgColor,
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 20px ${borderColor}40, 0 4px 16px rgba(0,0,0,0.6)`,
        }}
        onClick={handleDismiss}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">{current.event.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3
                className="text-sm font-bold truncate"
                style={{
                  color: isGood ? '#4ade80' : isBad ? '#ef4444' : '#FFD700',
                }}
              >
                {current.event.title}
              </h3>
              <button
                className="text-gray-500 text-xs shrink-0 hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
              >
                ✕
              </button>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#ccc' }}>
              {current.event.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

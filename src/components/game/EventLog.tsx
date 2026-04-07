'use client';

import React from 'react';
import { useGameStore } from '@/game/store';

export default function EventLog() {
  const { notifications, activeEvents, markNotificationRead, clearAllNotifications } = useGameStore();
  const { showEventLog, setShowEventLog } = useEventLogState();

  if (!showEventLog) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      onClick={() => setShowEventLog(false)}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-t-2xl p-4 pb-6 max-h-[70vh] overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(to bottom, #2a1500, #1a0a00)',
          borderTop: '2px solid rgba(218,165,32,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-lg font-bold"
            style={{ color: '#FFD700', fontFamily: 'serif' }}
          >
            📜 事件记录
          </h2>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-xs px-2 py-0.5 rounded transition-all active:scale-90"
                style={{
                  color: '#ff6666',
                  background: 'rgba(255,0,0,0.1)',
                  border: '1px solid rgba(255,0,0,0.2)',
                }}
              >
                清空
              </button>
            )}
            <button
              onClick={() => setShowEventLog(false)}
              className="text-gray-400 text-xl px-2 active:scale-90"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Active events */}
        {activeEvents.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-bold mb-1.5" style={{ color: '#ef4444' }}>
              ⚡ 当前生效事件
            </h3>
            <div className="space-y-1">
              {activeEvents.map((evt, i) => (
                <div
                  key={`active-${i}`}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                  style={{
                    background: 'rgba(255,50,50,0.15)',
                    border: '1px solid rgba(255,50,50,0.3)',
                  }}
                >
                  <span className="text-base">{evt.emoji}</span>
                  <div className="flex-1">
                    <span className="text-xs font-bold" style={{ color: '#ef4444' }}>
                      {evt.title}
                    </span>
                    {evt.remainingTicks !== undefined && evt.remainingTicks > 0 && (
                      <span className="text-[10px] ml-2" style={{ color: '#999' }}>
                        (剩余 {evt.remainingTicks} 回合)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification list */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-bold" style={{ color: '#DAA520' }}>
            历史通知
          </h3>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
              background: 'rgba(218,165,32,0.2)',
              color: '#FFD700',
            }}>
              {unreadCount} 未读
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 max-h-96">
          {notifications.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: '#666' }}>
              暂无事件记录
            </p>
          ) : (
            notifications.slice(0, 20).map(notif => {
              const isGood = notif.event.severity === 'good';
              const isBad = notif.event.severity === 'bad';
              const borderColor = isGood ? 'rgba(74,222,128,0.3)' : isBad ? 'rgba(239,68,68,0.3)' : 'rgba(218,165,32,0.3)';
              const dotColor = isGood ? '#4ade80' : isBad ? '#ef4444' : '#DAA520';

              return (
                <div
                  key={notif.id}
                  className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all active:scale-[0.98]"
                  style={{
                    background: notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${notif.read ? 'transparent' : borderColor}`,
                  }}
                  onClick={() => markNotificationRead(notif.id)}
                >
                  <span className="text-base leading-none mt-0.5">{notif.event.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
                      )}
                      <span className="text-xs font-bold truncate" style={{ color: '#ddd' }}>
                        {notif.event.title}
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5 leading-tight" style={{ color: '#999' }}>
                      {notif.event.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Local state for showing/hiding the event log panel (not in game store to avoid save/load issues)
function useEventLogState() {
  const [showEventLog, setShowEventLog] = React.useState(false);

  // Expose setShowEventLog globally so TopBar can call it
  React.useEffect(() => {
    (window as unknown as Record<string, unknown>).__eventLogSetShow = setShowEventLog;
    return () => {
      delete (window as unknown as Record<string, unknown>).__eventLogSetShow;
    };
  }, []);

  return { showEventLog, setShowEventLog };
}

// Helper to open event log from TopBar
export function openEventLog() {
  const setShow = (window as unknown as Record<string, unknown>).__eventLogSetShow as ((show: boolean) => void) | undefined;
  if (setShow) setShow(true);
}

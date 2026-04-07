'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { TRADE_OPTIONS, TRADE_COOLDOWN } from '@/game/constants';

export default function MarketTradePanel() {
  const {
    showMarketTrade,
    setShowMarketTrade,
    resources,
    storageCapacity,
    tickCount,
    lastTradeTick,
    executeTrade,
  } = useGameStore();

  if (!showMarketTrade) return null;

  const onCooldown = tickCount - lastTradeTick < TRADE_COOLDOWN;
  const goldCap = storageCapacity * 5;

  const handleTrade = (tradeId: string) => {
    if (onCooldown) return;
    executeTrade(tradeId);
  };

  const canAfford = (trade: typeof TRADE_OPTIONS[0]) => {
    return resources[trade.giveResource] >= trade.giveAmount;
  };

  const wouldExceed = (trade: typeof TRADE_OPTIONS[0]) => {
    const cap = trade.receiveResource === 'gold' ? goldCap : storageCapacity;
    return resources[trade.receiveResource] + trade.receiveAmount > cap;
  };

  const sellOptions = TRADE_OPTIONS.filter(t => t.id.startsWith('sell_'));
  const buyOptions = TRADE_OPTIONS.filter(t => t.id.startsWith('buy_'));

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center"
      onClick={() => setShowMarketTrade(false)}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative w-full max-w-sm rounded-t-2xl p-4 pb-6"
        style={{
          background: 'linear-gradient(to bottom, #2a1500, #1a0a00)',
          border: '1px solid rgba(218,165,32,0.4)',
          borderBottom: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            <h3 className="text-base font-bold" style={{ color: '#FFD700' }}>
              市场交易
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onCooldown && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,100,100,0.2)', color: '#ff6666' }}>
                冷却中...
              </span>
            )}
            <button
              onClick={() => setShowMarketTrade(false)}
              className="text-gray-400 text-lg px-1 active:scale-90"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Storage info */}
        <div className="mb-3 px-2 py-1.5 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-[10px]" style={{ color: '#888' }}>
            仓储容量: 📦{Math.floor(resources.food)}/{storageCapacity}
            {' '}💰{Math.floor(resources.gold)}/{goldCap}
          </p>
        </div>

        {/* Sell section */}
        <div className="mb-3">
          <p className="text-xs font-bold mb-2" style={{ color: '#DAA520' }}>📊 出售资源</p>
          <div className="grid grid-cols-2 gap-1.5">
            {sellOptions.map(trade => {
              const affordable = canAfford(trade);
              return (
                <button
                  key={trade.id}
                  onClick={() => handleTrade(trade.id)}
                  disabled={!affordable || onCooldown}
                  className="rounded-lg p-2 text-left transition-all active:scale-95 disabled:opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm">{trade.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: '#FFD700' }}>{trade.name}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: '#aaa' }}>
                    -{trade.giveAmount} → +{trade.receiveAmount} 💰
                  </p>
                  <p className="text-[10px]" style={{ color: affordable ? '#66cc66' : '#cc6666' }}>
                    当前: {Math.floor(resources[trade.giveResource])}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Buy section */}
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: '#DAA520' }}>🛒 购买资源</p>
          <div className="grid grid-cols-2 gap-1.5">
            {buyOptions.map(trade => {
              const affordable = canAfford(trade);
              const exceed = wouldExceed(trade);
              const disabled = !affordable || exceed || onCooldown;
              return (
                <button
                  key={trade.id}
                  onClick={() => handleTrade(trade.id)}
                  disabled={disabled}
                  className="rounded-lg p-2 text-left transition-all active:scale-95 disabled:opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm">{trade.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: '#FFD700' }}>{trade.name}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: '#aaa' }}>
                    -{trade.giveAmount} 💰 → +{trade.receiveAmount}
                  </p>
                  <p className="text-[10px]" style={{ color: disabled ? '#cc6666' : '#66cc66' }}>
                    {exceed ? '仓储已满' : affordable ? `💰${Math.floor(resources.gold)}` : '金币不足'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip */}
        <p className="text-[10px] mt-3 text-center" style={{ color: '#666' }}>
          需要「市场」建筑连接道路才能交易
        </p>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import StartScreen from '@/components/game/StartScreen';
import TopBar from '@/components/game/TopBar';
import ResourceBar from '@/components/game/ResourceBar';
import GameCanvas from '@/components/game/GameCanvas';
import BuildBar from '@/components/game/BuildBar';
import InfoBar from '@/components/game/InfoBar';
import StatsPanel from '@/components/game/StatsPanel';
import BuildingInfo from '@/components/game/BuildingInfo';
import MarketTradePanel from '@/components/game/MarketTradePanel';
import VictoryModal from '@/components/game/VictoryModal';
import NotificationBanner from '@/components/game/NotificationBanner';
import EventLog from '@/components/game/EventLog';
import { useGameStore } from '@/game/store';

export default function Home() {
  const showStartScreen = useGameStore(s => s.showStartScreen);

  return (
    <div
      className="flex flex-col h-dvh w-screen overflow-hidden"
      style={{
        background: '#0a0500',
        color: '#fff',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Start Screen Overlay */}
      {showStartScreen && <StartScreen />}

      {/* Top Bar */}
      <TopBar />

      {/* Resource Bar */}
      <ResourceBar />

      {/* Game Canvas */}
      <GameCanvas />

      {/* Building Bar */}
      <BuildBar />

      {/* Bottom Info Bar */}
      <InfoBar />

      {/* Overlays */}
      <StatsPanel />
      <BuildingInfo />
      <MarketTradePanel />
      <VictoryModal />
      <NotificationBanner />
      <EventLog />
    </div>
  );
}

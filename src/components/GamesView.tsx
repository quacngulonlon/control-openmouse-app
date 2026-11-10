import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { MouseDevice } from '../types/mouse';
import { deviceManager } from '../drivers/deviceManager';

interface GamePreset {
  id: string;
  name: string;
  genre: string;
  desc: string;
  recommendedDpi: number;
  recommendedRate: number;
  lod: '1mm' | '2mm';
  debounceMs: number;
}

const gamePresets: GamePreset[] = [
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    genre: 'Tactical FPS',
    desc: 'High precision and stability for click-timing and micro-adjustments.',
    recommendedDpi: 800,
    recommendedRate: 1000,
    lod: '1mm',
    debounceMs: 2,
  },
  {
    id: 'valorant',
    name: 'Valorant',
    genre: 'Tactical FPS',
    desc: 'Ultra-low debounce time and low lift-off distance for rapid crosshair placement.',
    recommendedDpi: 800,
    recommendedRate: 2000,
    lod: '1mm',
    debounceMs: 1,
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    genre: 'Battle Royale',
    desc: 'Balanced tracking profile for high-speed tracking and quick 180 turns.',
    recommendedDpi: 1600,
    recommendedRate: 4000,
    lod: '1mm',
    debounceMs: 4,
  },
  {
    id: 'overwatch',
    name: 'Overwatch 2',
    genre: 'Hero Shooter',
    desc: 'Maximum polling rate responsiveness and smooth sensor filtering.',
    recommendedDpi: 1600,
    recommendedRate: 8000,
    lod: '1mm',
    debounceMs: 2,
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    genre: 'Battle Royale',
    desc: 'Reliable switch actuation for building binds and flick edits.',
    recommendedDpi: 800,
    recommendedRate: 1000,
    lod: '2mm',
    debounceMs: 4,
  },
  {
    id: 'dota2',
    name: 'Dota 2 / League',
    genre: 'MOBA',
    desc: 'Comfortable DPI with slightly higher debounce to prevent accidental double-clicks.',
    recommendedDpi: 1200,
    recommendedRate: 1000,
    lod: '2mm',
    debounceMs: 8,
  },
];

interface GamesViewProps {
  device: MouseDevice | null;
}

export const GamesView: React.FC<GamesViewProps> = ({ device }) => {
  const [appliedGame, setAppliedGame] = useState<string | null>(null);

  const handleApplyPreset = async (preset: GamePreset) => {
    if (!device) {
      alert('Please connect or select a mouse first to apply game profile settings.');
      return;
    }
    setAppliedGame(preset.id);
    await deviceManager.setDpi(0, preset.recommendedDpi);
    await deviceManager.setPollingRate(preset.recommendedRate);
    await deviceManager.setSensor({
      lod: preset.lod,
      debounceMs: preset.debounceMs,
    });
    setTimeout(() => setAppliedGame(null), 2000);
  };

  return (
    <section className="page page-overview page-pad-bottom-60">
      <header className="om-page-head">
        <h1 className="page-title-h1">Game Profiles</h1>
        <p className="om-meta">Curated sensor and sensitivity configurations for competitive titles.</p>
      </header>

      <div className="game-card-grid">
        {gamePresets.map((game) => (
          <div key={game.id} className="setting-card">
            <div className="flex-between-center">
              <h3 className="card-title-16">{game.name}</h3>
              <span className="badge-demo">{game.genre}</span>
            </div>

            <p className="game-desc-text">
              {game.desc}
            </p>

            <div className="game-preset-summary">
              <div className="game-preset-row">
                <span className="color-text-3">Recommended DPI:</span>
                <span className="accent-text-bold">{game.recommendedDpi} DPI</span>
              </div>
              <div className="game-preset-row">
                <span className="color-text-3">Polling Rate:</span>
                <span className="text-1-bold">{game.recommendedRate} Hz</span>
              </div>
              <div className="game-preset-row">
                <span className="color-text-3">LOD / Debounce:</span>
                <span className="text-1-bold">{game.lod} / {game.debounceMs}ms</span>
              </div>
            </div>

            <button
              type="button"
              className="om-btn is-primary game-preset-apply-btn"
              onClick={() => handleApplyPreset(game)}
            >
              {appliedGame === game.id ? (
                <>
                  <Check size={14} /> Applied to Mouse
                </>
              ) : (
                'Apply to Active Profile'
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

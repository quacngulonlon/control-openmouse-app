import React from 'react';
import { Megaphone, CheckCircle2 } from 'lucide-react';

export const WhatsNewView: React.FC = () => {
  const updates = [
    {
      version: 'v2.0.888',
      date: 'Current Release',
      features: [
        'Full WebHID support for Logitech HID++ 2.0 (G502 X, G Pro X Superlight 2, G502 LIGHTSPEED).',
        'Razer 90-byte packet protocol driver for Razer Viper V3 Pro, DeathAdder V3, Cobra, and Basilisk.',
        'Pulsar Pro & Compx 64-byte feature reports (X2 V2, X2H, eS Series).',
        'Added PixArt PAW3395/3950 low-level controls: Motion Sync, Angle Snapping, and Ripple Control.',
        'Hardware Mutex & Command Queue safety layer to prevent firmware hangs.',
        'Real-time USB Polling Rate monitor and switch debounce double-click test tool.',
      ],
    },
    {
      version: 'v2.0.850',
      date: 'Previous Release',
      features: [
        'OpenMouse Bridge release for Windows background profiles and Firefox support.',
        'Finalmouse UltralightX and Starlight X 8K polling rate support.',
        'Attack Shark & VXE Nordic 52840 MCU profile synchronization.',
      ],
    },
  ];

  return (
    <section className="page page-overview page-pad-bottom-60">
      <header className="om-page-head">
        <h1 className="page-title-h1">What's new</h1>
        <p className="om-meta">Recent changes, supported hardware updates, and changelogs.</p>
      </header>

      <div className="flex-col-gap20 margin-top-24">
        {updates.map((item, idx) => (
          <div key={idx} className="setting-card">
            <div className="flex-center-gap10 margin-bottom-12">
              <Megaphone size={16} className="whatsnew-icon" />
              <h3 className="card-title-16">{item.version}</h3>
              <span className="badge-demo">{item.date}</span>
            </div>

            <ul className="whatsnew-list">
              {item.features.map((f, fIdx) => (
                <li key={fIdx} className="whatsnew-item">
                  <CheckCircle2 size={15} className="whatsnew-icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

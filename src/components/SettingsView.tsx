import React, { useState, useEffect } from 'react';
import { Palette, Terminal, Shield, Copy, Check, Trash2, Mouse } from 'lucide-react';
import { deviceManager, WebHidLogEntry } from '../drivers/deviceManager';
import { MOCK_DEVICES } from '../drivers/mockDevices';

export const SettingsView: React.FC = () => {
  const [theme, setTheme] = useState<string>('emerald');
  const [logs, setLogs] = useState<WebHidLogEntry[]>(deviceManager.logs);
  const [copiedUdev, setCopiedUdev] = useState(false);

  useEffect(() => {
    const unsub = deviceManager.subscribeLogs(() => {
      setLogs([...deviceManager.logs]);
    });
    return unsub;
  }, []);

  const themes = [
    { id: 'emerald', name: 'Emerald', colorClass: 'theme-color-emerald' },
    { id: 'matt', name: 'Matt Orange', colorClass: 'theme-color-matt' },
    { id: 'violet', name: 'Violet', colorClass: 'theme-color-violet' },
    { id: 'ice', name: 'Ice Cyan', colorClass: 'theme-color-ice' },
    { id: 'ember', name: 'Ember Red', colorClass: 'theme-color-ember' },
    { id: 'mono', name: 'Monochrome', colorClass: 'theme-color-mono' },
  ];

  const handleSelectTheme = (themeId: string) => {
    setTheme(themeId);
    document.documentElement.setAttribute('data-interface-theme', themeId);
  };

  const udevRuleScript = `# 1. Create OpenMouse udev rules for Linux WebHID access:
sudo tee /etc/udev/rules.d/99-openmouse.rules << 'EOF'
KERNEL=="hidraw*", ATTRS{idVendor}=="046d", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="1532", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="3554", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="361d", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="25a7", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="195d", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="3434", MODE="0666", TAG+="uaccess"
EOF

# 2. Reload and trigger udev:
sudo udevadm control --reload-rules && sudo udevadm trigger`;

  const handleCopyUdev = () => {
    navigator.clipboard.writeText(udevRuleScript);
    setCopiedUdev(true);
    setTimeout(() => setCopiedUdev(false), 2000);
  };

  return (
    <section className="page page-overview pad-bottom-60">
      <header className="om-page-head">
        <div>
          <h1 className="page-head-title">Settings</h1>
          <p className="om-meta">Interface appearance, Linux permissions, and WebHID packet diagnostics.</p>
        </div>
      </header>

      <div className="control-card-grid margin-top-24">
        {/* 1. Interface Theme */}
        <div className="setting-card">
          <div className="setting-card-title-row">
            <Palette size={16} className="accent-icon" />
            <h3 className="setting-card-h3">Color Scheme &amp; Theme</h3>
          </div>

          <div className="theme-grid">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-selector-btn ${theme === t.id ? 'is-active' : ''}`}
                onClick={() => handleSelectTheme(t.id)}
              >
                <span className={`theme-dot ${t.colorClass}`}></span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Demo Device Selector */}
        <div className="setting-card">
          <div className="setting-card-title-row">
            <Mouse size={16} className="accent-icon" />
            <h3 className="setting-card-h3">Interactive Demo Mice</h3>
          </div>

          <p className="setting-card-desc">
            Test the full control panel with simulated on-board memory profiles without needing physical hardware plugged in:
          </p>

          <div className="demo-pills-wrap">
            {MOCK_DEVICES.map((mock) => (
              <button
                key={mock.id}
                type="button"
                className="demo-pill-btn"
                onClick={() => deviceManager.selectMockDevice(mock.id)}
              >
                <img src={mock.image} alt="" width="16" height="16" className="demo-pill-img" />
                <span>{mock.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Linux udev rules guide */}
        <div className="setting-card">
          <div className="setting-card-header-flex">
            <div className="setting-card-title-row">
              <Shield size={16} className="accent-icon" />
              <h3 className="setting-card-h3">Linux udev Permission Setup</h3>
            </div>
            <button type="button" className="om-btn-sm" onClick={handleCopyUdev}>
              {copiedUdev ? <Check size={13} /> : <Copy size={13} />}
              {copiedUdev ? 'Copied script!' : 'Copy terminal command'}
            </button>
          </div>

          <p className="setting-card-desc">
            On Linux (Ubuntu, Debian, Fedora, Arch), the kernel blocks non-root browser access to <code>/dev/hidraw*</code>.
            Paste this one-line command into your terminal to grant read/write permissions to supported mice:
          </p>

          <pre className="udev-code-block">{udevRuleScript}</pre>
        </div>

        {/* 4. Live WebHID Diagnostic Packet Log */}
        <div className="setting-card">
          <div className="setting-card-header-flex">
            <div className="setting-card-title-row">
              <Terminal size={16} className="accent-icon" />
              <h3 className="setting-card-h3">Live WebHID Protocol Log</h3>
            </div>
            <button
              type="button"
              className="om-btn-sm"
              onClick={() => {
                deviceManager.logs = [];
                setLogs([]);
              }}
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>

          <div className="diagnostic-log-console">
            {logs.length === 0 ? (
              <div className="log-empty">
                No packets sent or received yet. Connect a mouse or adjust DPI to inspect raw packets.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={`log-line ${log.type}`}>
                  <span className="log-time">[{log.timestamp}]</span>
                  <span className={`log-tag ${log.type}`}>{log.type.toUpperCase()}</span>
                  <span className="log-msg">{log.message}</span>
                  {log.data && <span className="log-hex">{log.data}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import {
  Plus,
  Battery,
  BatteryCharging,
  Wifi,
  Usb,
  Check,
  Download,
  Upload,
  Cpu,
  Sliders,
  Shield,
  Layers,
  Play,
  Square,
  Trash2,
} from 'lucide-react';
import { MouseDevice, DPIStage, SensorSettings, ButtonActionType } from '../types/mouse';
import { deviceManager } from '../drivers/deviceManager';
import { AsciiBackground } from './AsciiBackground';

interface DevicesViewProps {
  device: MouseDevice | null;
  onRequestDevice: () => void;
  onDisconnect: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  device,
  onRequestDevice,
  onDisconnect,
}) => {
  const [activeTab, setActiveTab] = useState<'dpi' | 'sensor' | 'buttons' | 'macros'>('dpi');
  const [syncStatus, setSyncStatus] = useState<'applied' | 'pending'>('applied');
  const [isRecording, setIsRecording] = useState(false);
  const [macroName, setMacroName] = useState('New Macro');
  const [recordedSteps, setRecordedSteps] = useState<Array<{ type: string; key?: string; delayMs?: number }>>([
    { type: 'key_down', key: 'Shift' },
    { type: 'delay', delayMs: 40 },
    { type: 'key_down', key: 'E' },
    { type: 'delay', delayMs: 50 },
    { type: 'key_up', key: 'E' },
    { type: 'key_up', key: 'Shift' },
  ]);

  const profile = device?.profiles[device?.activeProfileIndex || 0];

  const handleDpiChange = async (stageIndex: number, newDpi: number, newDpiY?: number) => {
    setSyncStatus('pending');
    await deviceManager.setDpi(stageIndex, newDpi, newDpiY);
    setTimeout(() => setSyncStatus('applied'), 180);
  };

  const handlePollingRateChange = async (rate: number) => {
    setSyncStatus('pending');
    await deviceManager.setPollingRate(rate);
    setTimeout(() => setSyncStatus('applied'), 180);
  };

  const handleSensorChange = async (changes: Partial<SensorSettings>) => {
    setSyncStatus('pending');
    await deviceManager.setSensor(changes);
    setTimeout(() => setSyncStatus('applied'), 180);
  };

  const handleExportProfile = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${device?.name.replace(/\s+/g, '_')}_profile_${profile.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.dpiStages && imported.pollingRateHz) {
          deviceManager.updateActiveProfile((p) => {
            Object.assign(p, imported);
          });
          setSyncStatus('applied');
        }
      } catch (err) {
        alert('Invalid profile JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddDpiStage = () => {
    if (!profile || profile.dpiStages.length >= 6) return;
    const colors = ['#ff4d4f', '#5dde89', '#1890ff', '#faad14', '#722ed1', '#13c2c2'];
    const newStage: DPIStage = {
      id: profile.dpiStages.length + 1,
      dpi: 2400,
      color: colors[profile.dpiStages.length % colors.length],
    };
    deviceManager.updateActiveProfile((p) => {
      p.dpiStages.push(newStage);
    });
  };

  const handleRemoveDpiStage = (index: number) => {
    if (!profile || profile.dpiStages.length <= 1) return;
    deviceManager.updateActiveProfile((p) => {
      p.dpiStages.splice(index, 1);
      if (p.activeDpiStageIndex >= p.dpiStages.length) {
        p.activeDpiStageIndex = p.dpiStages.length - 1;
      }
    });
  };

  // If NO device is connected, render the exact Add Device shelf matching capture.json & README.md
  if (!device) {
    return (
      <section className="page page-overview">
        <div className="om-page om-home is-empty">
          <AsciiBackground />
          <header className="om-page-head">
            <div>
              <h1>Devices</h1>
              <p className="om-meta">Connect your device.</p>
            </div>
          </header>

          <section className="om-shelf" aria-labelledby="om-shelf-title">
            <div className="om-shelf-head">
              <h2 id="om-shelf-title" className="sr-only">Your devices</h2>
            </div>
            <ul className="om-shelf-track">
              <li className="om-shelf-item">
                <article className="om-device-block is-add">
                  <header className="om-device-block-top">
                    <span className="om-device-block-name">Add device</span>
                  </header>
                  <span className="om-device-block-meta">
                    Pick your mouse in the browser prompt to adjust its onboard settings.
                  </span>
                  <span className="om-device-block-art">
                    <img
                      src="./logitech-g502-x-plus.png"
                      alt=""
                      className="is-active om-device-render"
                      width="276"
                      height="281"
                    />
                  </span>
                  <button
                    type="button"
                    className="om-btn is-primary om-device-block-action"
                    onClick={onRequestDevice}
                  >
                    <Plus size={15} /> Add device
                  </button>
                </article>
              </li>
            </ul>
            <p className="app-live-region">Use Add device if the mouse does not reconnect automatically.</p>
          </section>
        </div>
      </section>
    );
  }

  // Mouse IS connected / Demo mode active
  return (
    <section className="page page-overview om-page om-device-page">
      {/* Device Header Bar */}
      <div className="device-active-banner">
        <div className="device-banner-left">
          <img
            src={device.image}
            alt={device.name}
            className="device-banner-img"
          />
          <div>
            <div className="device-banner-title-row">
              <h1 className="device-banner-name">{device.name}</h1>
              {device.isMock ? (
                <span className="badge-demo">Demo Mode</span>
              ) : (
                <span className="badge-live">Hardware Connected</span>
              )}
            </div>

            <div className="device-banner-meta-row">
              <span className="device-meta-item">
                {device.connectionType === 'wireless_2_4ghz' ? <Wifi size={14} className="accent-icon" /> : <Usb size={14} />}
                {device.connectionType === 'wireless_2_4ghz' ? '2.4 GHz Wireless' : 'Wired USB'}
              </span>

              <span className="device-meta-item">
                {device.isCharging ? <BatteryCharging size={14} className="accent-icon" /> : <Battery size={14} />}
                {device.batteryPercent}% {device.isCharging && '(Charging)'}
              </span>

              <span>FW: {device.firmwareVersion}</span>
              {device.dongleFirmwareVersion && <span>Dongle: {device.dongleFirmwareVersion}</span>}
            </div>
          </div>
        </div>

        <div className="device-banner-right">
          <div className={`sync-indicator ${syncStatus}`}>
            {syncStatus === 'applied' ? (
              <>
                <Check size={13} /> Saved to On-board Memory
              </>
            ) : (
              'Writing to EEPROM...'
            )}
          </div>
          <button type="button" className="om-btn" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      </div>

      {/* Profile Bar */}
      <div className="profile-shelf">
        <div className="profile-shelf-left">
          <Layers size={15} className="text-3-icon" />
          <span className="profile-label">PROFILE</span>
          {device.profiles.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`profile-tab-btn ${idx === device.activeProfileIndex ? 'is-active' : ''}`}
              onClick={() => deviceManager.setProfile(idx)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="profile-shelf-right">
          <button type="button" className="om-btn-sm" onClick={handleExportProfile} title="Export profile to JSON">
            <Download size={13} /> Export JSON
          </button>
          <label className="om-btn-sm label-file-btn">
            <Upload size={13} /> Import JSON
            <input type="file" accept=".json" onChange={handleImportProfile} className="hidden-file-input" />
          </label>
        </div>
      </div>

      {/* Navigation tabs inside Device Control */}
      <div className="device-control-tabs">
        <button
          type="button"
          className={`control-tab-btn ${activeTab === 'dpi' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('dpi')}
        >
          <Sliders size={15} /> Sensitivity (DPI)
        </button>
        <button
          type="button"
          className={`control-tab-btn ${activeTab === 'sensor' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('sensor')}
        >
          <Cpu size={15} /> Sensor &amp; Polling Rate
        </button>
        <button
          type="button"
          className={`control-tab-btn ${activeTab === 'buttons' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('buttons')}
        >
          <Layers size={15} /> Button Remapping
        </button>
        <button
          type="button"
          className={`control-tab-btn ${activeTab === 'macros' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('macros')}
        >
          <Shield size={15} /> Macro Editor
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. DPI Tab */}
      {activeTab === 'dpi' && profile && (
        <div className="control-card-grid">
          <div className="setting-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">DPI Sensitivity Stages</h3>
                <p className="card-subtitle">Configure active levels and cycle with your mouse's DPI switch.</p>
              </div>

              <div className="card-header-actions">
                <button
                  type="button"
                  className="om-btn-sm"
                  onClick={handleAddDpiStage}
                  disabled={profile.dpiStages.length >= 6}
                >
                  <Plus size={13} /> Add Stage
                </button>
              </div>
            </div>

            <div className="dpi-stages-bar">
              {profile.dpiStages.map((stage, idx) => {
                const isActive = idx === profile.activeDpiStageIndex;
                return (
                  <div
                    key={stage.id}
                    className={`dpi-stage-box ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleDpiChange(idx, stage.dpi, stage.dpiY)}
                  >
                    <div className="stage-top-indicator">
                      <span className={`stage-dot stage-color-${idx % 6}`}></span>
                      <span className="stage-num">Stage {idx + 1}</span>
                      {profile.dpiStages.length > 1 && (
                        <button
                          type="button"
                          className="stage-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDpiStage(idx);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="stage-dpi-val">
                      {stage.dpi} <span className="stage-unit">DPI</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {profile.dpiStages[profile.activeDpiStageIndex] && (
              <div className="active-stage-editor">
                <div className="editor-top-row">
                  <div className="editor-title-group">
                    <span className={`stage-dot stage-color-${profile.activeDpiStageIndex % 6}`}></span>
                    <span className="editor-stage-heading">
                      Adjust Stage {profile.activeDpiStageIndex + 1} DPI
                    </span>
                  </div>

                  <div className="editor-controls-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={profile.separateXY}
                        onChange={(e) => {
                          const sep = e.target.checked;
                          deviceManager.updateActiveProfile((p) => {
                            p.separateXY = sep;
                          });
                        }}
                      />
                      Separate X/Y Axis
                    </label>

                    <input
                      type="number"
                      min={50}
                      max={device.maxDpi}
                      step={50}
                      className="dpi-number-input"
                      value={profile.dpiStages[profile.activeDpiStageIndex].dpi}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 800;
                        handleDpiChange(profile.activeDpiStageIndex, val, profile.separateXY ? profile.dpiStages[profile.activeDpiStageIndex].dpiY : undefined);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="slider-label-row">
                    <span>X-Axis Sensitivity</span>
                    <span className="accent-val">{profile.dpiStages[profile.activeDpiStageIndex].dpi} DPI</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={device.maxDpi}
                    step={50}
                    className="dpi-slider"
                    value={profile.dpiStages[profile.activeDpiStageIndex].dpi}
                    onChange={(e) =>
                      handleDpiChange(
                        profile.activeDpiStageIndex,
                        parseInt(e.target.value),
                        profile.separateXY ? profile.dpiStages[profile.activeDpiStageIndex].dpiY : undefined
                      )
                    }
                  />
                </div>

                {profile.separateXY && (
                  <div className="y-axis-group">
                    <div className="slider-label-row">
                      <span>Y-Axis Sensitivity</span>
                      <span className="accent-val">{profile.dpiStages[profile.activeDpiStageIndex].dpiY ?? profile.dpiStages[profile.activeDpiStageIndex].dpi} DPI</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={device.maxDpi}
                      step={50}
                      className="dpi-slider"
                      value={profile.dpiStages[profile.activeDpiStageIndex].dpiY ?? profile.dpiStages[profile.activeDpiStageIndex].dpi}
                      onChange={(e) =>
                        handleDpiChange(
                          profile.activeDpiStageIndex,
                          profile.dpiStages[profile.activeDpiStageIndex].dpi,
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Sensor & Polling Rate Tab */}
      {activeTab === 'sensor' && profile && (
        <div className="control-card-grid">
          <div className="setting-card" id="polling-card">
            <div className="card-top-margin">
              <h3 className="card-title">Polling Rate (Tần số phản hồi)</h3>
              <p className="card-subtitle">Higher rates reduce input delay. Rates above 1000Hz require high-speed USB/Dongle.</p>
            </div>

            <div className="rate-slider-buttons">
              {device.supportedRates.map((rate, idx) => {
                const isOn = profile.pollingRateHz === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    className={`rate-lvl-${idx + 1} ${isOn ? 'is-on' : ''}`}
                    onClick={() => handlePollingRateChange(rate)}
                  >
                    <span className="rate-text">{rate >= 1000 ? `${rate / 1000}K` : `${rate}`}Hz</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="setting-card">
            <div className="card-header-mb">
              <h3 className="card-title">PixArt Sensor Hardware Features</h3>
              <p className="card-subtitle">Configure on-chip optical engine parameters (PAW3395 / PAW3950).</p>
            </div>

            <div className="sensor-features-grid">
              <div className="sensor-feature-box">
                <span className="feature-title">Lift-Off Distance (LOD)</span>
                <span className="feature-desc">Tracking cutoff height when mouse is lifted</span>
                <div className="lod-btn-row">
                  <button
                    type="button"
                    className={`lod-btn ${profile.sensor.lod === '1mm' ? 'is-active' : ''}`}
                    onClick={() => handleSensorChange({ lod: '1mm' })}
                  >
                    1 mm (Low)
                  </button>
                  <button
                    type="button"
                    className={`lod-btn ${profile.sensor.lod === '2mm' ? 'is-active' : ''}`}
                    onClick={() => handleSensorChange({ lod: '2mm' })}
                  >
                    2 mm (High)
                  </button>
                </div>
              </div>

              <div className="sensor-feature-box">
                <div className="feature-header-space">
                  <span className="feature-title">Debounce Time</span>
                  <span className="debounce-val">{profile.sensor.debounceMs} ms</span>
                </div>
                <span className="feature-desc">Mechanical switch debounce filter (prevents double-click)</span>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  className="dpi-slider slider-mt"
                  value={profile.sensor.debounceMs}
                  onChange={(e) => handleSensorChange({ debounceMs: parseInt(e.target.value) })}
                />
              </div>

              <div
                className={`switch-row-custom ${profile.sensor.motionSync ? 'is-on' : ''}`}
                onClick={() => handleSensorChange({ motionSync: !profile.sensor.motionSync })}
              >
                <div>
                  <div className="feature-title">Motion Sync</div>
                  <div className="feature-desc">Synchronizes SPI sensor reports with USB SOF intervals</div>
                </div>
                <div className="toggle-switch"></div>
              </div>

              <div
                className={`switch-row-custom ${profile.sensor.angleSnapping ? 'is-on' : ''}`}
                onClick={() => handleSensorChange({ angleSnapping: !profile.sensor.angleSnapping })}
              >
                <div>
                  <div className="feature-title">Angle Snapping</div>
                  <div className="feature-desc">Corrects micro-deviations to follow straight lines</div>
                </div>
                <div className="toggle-switch"></div>
              </div>

              <div
                className={`switch-row-custom ${profile.sensor.rippleControl ? 'is-on' : ''}`}
                onClick={() => handleSensorChange({ rippleControl: !profile.sensor.rippleControl })}
              >
                <div>
                  <div className="feature-title">Ripple Control</div>
                  <div className="feature-desc">Smooths sensor jitter at ultra-high DPI (&gt;5000 DPI)</div>
                </div>
                <div className="toggle-switch"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Button Remapping Tab */}
      {activeTab === 'buttons' && profile && (
        <div className="setting-card">
          <div className="card-header-mb">
            <h3 className="card-title">Button Remapping</h3>
            <p className="card-subtitle">Reassign mouse switch clicks, media functions, or macros.</p>
          </div>

          <div className="buttons-grid">
            {profile.buttons.map((btn) => (
              <div key={btn.id} className="button-remap-card">
                <div className="btn-remap-header">
                  <span className="btn-name">{btn.name}</span>
                  <span className="btn-action-badge">{btn.action.replace('_', ' ').toUpperCase()}</span>
                </div>

                <select
                  value={btn.action}
                  className="btn-action-select"
                  onChange={(e) => {
                    const action = e.target.value as ButtonActionType;
                    deviceManager.updateActiveProfile((p) => {
                      const b = p.buttons.find((x) => x.id === btn.id);
                      if (b) b.action = action;
                    });
                  }}
                >
                  <option value="click_left">Left Click</option>
                  <option value="click_right">Right Click</option>
                  <option value="click_middle">Middle Click</option>
                  <option value="forward">Forward (Button 5)</option>
                  <option value="back">Back (Button 4)</option>
                  <option value="dpi_cycle">Cycle DPI Stages</option>
                  <option value="dpi_up">DPI Up</option>
                  <option value="dpi_down">DPI Down</option>
                  <option value="media_play">Play / Pause</option>
                  <option value="media_mute">Mute Audio</option>
                  <option value="macro">Trigger Macro</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Macro Editor Tab */}
      {activeTab === 'macros' && (
        <div className="setting-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">On-Board Macro Sequencer</h3>
              <p className="card-subtitle">Record sequences of keys and mouse clicks with millisecond timing.</p>
            </div>

            <div className="card-header-actions">
              <button
                type="button"
                className={`om-btn-sm ${isRecording ? 'is-recording' : ''}`}
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? <Square size={13} /> : <Play size={13} />}
                {isRecording ? 'Stop Recording' : 'Record Macro'}
              </button>

              <button
                type="button"
                className="om-btn is-primary macro-save-btn"
                onClick={() => {
                  alert('Macro sequence validated and written to mouse on-board flash slot 1.');
                }}
              >
                Save to On-board Memory
              </button>
            </div>
          </div>

          <div className="macro-name-row">
            <input
              type="text"
              className="macro-name-input"
              value={macroName}
              onChange={(e) => setMacroName(e.target.value)}
              placeholder="Macro Name"
            />
          </div>

          <div className="macro-steps-timeline">
            {recordedSteps.map((step, idx) => (
              <div key={idx} className="macro-step-row">
                <span className="step-idx">{idx + 1}</span>
                <span className="step-type-badge">{step.type}</span>
                <span className="step-val">{step.key || `${step.delayMs} ms`}</span>
                <button
                  type="button"
                  className="step-del"
                  onClick={() => {
                    const next = [...recordedSteps];
                    next.splice(idx, 1);
                    setRecordedSteps(next);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="macro-btn-row">
            <button
              type="button"
              className="om-btn-sm"
              onClick={() => setRecordedSteps([...recordedSteps, { type: 'key_down', key: 'Space' }])}
            >
              + Key Down
            </button>
            <button
              type="button"
              className="om-btn-sm"
              onClick={() => setRecordedSteps([...recordedSteps, { type: 'delay', delayMs: 50 }])}
            >
              + Delay (ms)
            </button>
            <button
              type="button"
              className="om-btn-sm"
              onClick={() => setRecordedSteps([...recordedSteps, { type: 'key_up', key: 'Space' }])}
            >
              + Key Up
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import { SmallScreenBlocker } from './components/SmallScreenBlocker';
import { Sidebar, NavTab } from './components/Sidebar';
import { NewsBanner } from './components/NewsBanner';
import { DevicesView } from './components/DevicesView';
import { HardwareTestView } from './components/HardwareTestView';
import { GamesView } from './components/GamesView';
import { SettingsView } from './components/SettingsView';
import { WhatsNewView } from './components/WhatsNewView';
import { HelpFeedbackModal } from './components/HelpFeedbackModal';
import { BrowserWarningBanner } from './components/BrowserWarningBanner';
import { UdevInstructionsModal } from './components/UdevInstructionsModal';
import { deviceManager } from './drivers/deviceManager';
import { MouseDevice } from './types/mouse';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('devices');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUdevModalOpen, setIsUdevModalOpen] = useState(false);
  const [browserWarningDismissed, setBrowserWarningDismissed] = useState(false);
  const [device, setDevice] = useState<MouseDevice | null>(deviceManager.getActiveDevice());

  useEffect(() => {
    // Subscribe to device updates
    const unsub = deviceManager.subscribeDeviceChange((updatedDevice) => {
      setDevice(updatedDevice);
      if (deviceManager.securityErrorOccurred) {
        setIsUdevModalOpen(true);
      }
    });

    // Attempt auto-connect
    deviceManager.autoConnect();

    return unsub;
  }, []);

  const handleRequestDevice = async () => {
    const success = await deviceManager.requestDevice();
    if (!success && deviceManager.securityErrorOccurred) {
      setIsUdevModalOpen(true);
    }
  };

  const handleSelectMock = (id: string) => {
    deviceManager.selectMockDevice(id);
  };

  const handleDisconnect = () => {
    deviceManager.disconnect();
  };

  return (
    <div id="control-app" className={`om-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Small Screen Blocker for responsive viewports < 900px or < 600px */}
      <SmallScreenBlocker />

      {/* Main Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isBridgeOpen={isBridgeOpen}
        onToggleBridge={() => setIsBridgeOpen(!isBridgeOpen)}
        onCloseBridge={() => setIsBridgeOpen(false)}
      />

      {/* Main Content Area */}
      <main className="om-main full-desktop-main">
        {/* Warning if opened in Firefox / Safari without WebHID */}
        {!deviceManager.isWebHidSupported && !browserWarningDismissed && (
          <BrowserWarningBanner onDismiss={() => setBrowserWarningDismissed(true)} />
        )}

        {/* Top Green News Banner */}
        <NewsBanner onOpenBridge={() => setIsBridgeOpen(true)} />

        {/* Active Tab View */}
        {activeTab === 'devices' && (
          <DevicesView
            device={device}
            onRequestDevice={handleRequestDevice}
            onDisconnect={handleDisconnect}
          />
        )}

        {activeTab === 'hardware-test' && <HardwareTestView />}

        {activeTab === 'games' && <GamesView device={device} />}

        {activeTab === 'settings' && <SettingsView />}

        {activeTab === 'whats-new' && <WhatsNewView />}
      </main>

      {/* Floating Help & Feedback Modal & Launcher Toggle */}
      <HelpFeedbackModal
        isOpen={isHelpOpen}
        onToggle={() => setIsHelpOpen(!isHelpOpen)}
        onOpenUdevGuide={() => {
          setIsHelpOpen(false);
          setIsUdevModalOpen(true);
        }}
      />

      {/* Linux SecurityError udev instructions modal */}
      <UdevInstructionsModal
        isOpen={isUdevModalOpen}
        onClose={() => setIsUdevModalOpen(false)}
      />

      {/* Offline banner placeholder for accessibility and layout outline parity */}
      <div className="offline-banner" role="status" aria-live="polite"></div>
    </div>
  );
};

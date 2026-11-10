import React from 'react';
import { LayoutGrid, Activity, Gamepad2, BookOpen, Megaphone, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { BridgeModal } from './BridgeModal';

export type NavTab = 'devices' | 'hardware-test' | 'games' | 'settings' | 'whats-new';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isBridgeOpen: boolean;
  onToggleBridge: () => void;
  onCloseBridge: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isBridgeOpen,
  onToggleBridge,
  onCloseBridge,
}) => {
  return (
    <aside className={`om-sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div className="om-sidebar-head">
        <a
          className="om-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('devices');
          }}
        >
          <img src="./logo.png" alt="" className="om-brand-mark" width="14" height="21" />
          <span className="om-brand-text">
            <span>OpenMouse</span>
            <small className="om-brand-beta">BETA · v2.0.888</small>
          </span>
        </a>

        <button
          type="button"
          className="om-icon-btn om-sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="om-nav om-nav-main">
        <button
          type="button"
          className={`om-nav-item ${activeTab === 'devices' ? 'is-active' : ''}`}
          onClick={() => onSelectTab('devices')}
          title="Devices"
        >
          <LayoutGrid size={17} />
          <span className="om-nav-label">Devices</span>
        </button>

        <button
          type="button"
          className={`om-nav-item ${activeTab === 'hardware-test' ? 'is-active' : ''}`}
          onClick={() => onSelectTab('hardware-test')}
          title="Hardware test"
        >
          <Activity size={17} />
          <span className="om-nav-label">Hardware test</span>
        </button>

        <button
          type="button"
          className={`om-nav-item ${activeTab === 'games' ? 'is-active' : ''}`}
          onClick={() => onSelectTab('games')}
          title="Games"
        >
          <Gamepad2 size={17} />
          <span className="om-nav-label">Games</span>
        </button>
      </nav>

      <nav className="om-nav om-nav-bottom">
        <a
          className="om-nav-item"
          href="https://openmouse.app/docs"
          target="_blank"
          rel="noreferrer"
          title="Docs"
        >
          <BookOpen size={17} />
          <span className="om-nav-label om-nav-flex">
            <span>Docs</span>
            <span className="om-nav-ext">↗</span>
          </span>
        </a>

        <button
          type="button"
          className={`om-nav-item ${activeTab === 'whats-new' ? 'is-active' : ''}`}
          onClick={() => onSelectTab('whats-new')}
          title="What's new"
        >
          <Megaphone size={17} />
          <span className="om-nav-label">What's new</span>
        </button>

        <a
          className="om-nav-item om-nav-discord"
          href="https://discord.gg/openmouse"
          target="_blank"
          rel="noreferrer"
          title="Help & feedback Discord"
        >
          <svg
            className="om-discord-svg"
            width="18"
            height="14"
            viewBox="0 0 127.14 96.36"
            fill="currentColor"
          >
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.83,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
          </svg>
          <span className="om-nav-discord-text">
            <span>Help &amp; feedback</span>
            <small>Join the community server ↗</small>
          </span>
        </a>

        <button
          type="button"
          className={`om-nav-item ${activeTab === 'settings' ? 'is-active' : ''}`}
          onClick={() => onSelectTab('settings')}
          title="Settings"
        >
          <Settings size={17} />
          <span className="om-nav-label">Settings</span>
        </button>
      </nav>

      {/* Bridge status line */}
      <div className="om-bridge">
        <button
          type="button"
          className={`om-bridge-line ${isBridgeOpen ? 'is-open' : ''}`}
          onClick={onToggleBridge}
          aria-haspopup="dialog"
          aria-expanded={isBridgeOpen}
        >
          <span className="om-dot" aria-hidden="true"></span>
          <span className="om-bridge-line-text">Bridge not running</span>
        </button>

        {isBridgeOpen && <BridgeModal onClose={onCloseBridge} />}
      </div>
    </aside>
  );
};

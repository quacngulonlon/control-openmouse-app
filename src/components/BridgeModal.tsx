import React from 'react';
import { X, Download } from 'lucide-react';

interface BridgeModalProps {
  onClose: () => void;
}

export const BridgeModal: React.FC<BridgeModalProps> = ({ onClose }) => {
  return (
    <div className="om-bridge-pop" role="dialog" aria-labelledby="om-bridge-pop-title">
      <header className="om-bridge-pop-head">
        <span className="om-dot" aria-hidden="true"></span>
        <h2 id="om-bridge-pop-title">OpenMouse Bridge</h2>
        <button
          type="button"
          className="om-icon-btn"
          aria-label="Close"
          onClick={onClose}
        >
          <X strokeWidth={2} aria-hidden="true" size={15} />
        </button>
      </header>

      <p className="om-bridge-pop-body">
        A small desktop companion that carries device reports for this page. It reaches Razer mice that Chrome now blocks, and adds per-game profiles and low-battery alerts.
      </p>

      <ul className="om-kv om-bridge-pop-facts">
        <li>
          <span>Status</span>
          <span>Not running</span>
        </li>
        <li>
          <span>Latest release</span>
          <span>...</span>
        </li>
      </ul>

      <div className="om-bridge-pop-foot">
        <a
          className="om-btn is-primary"
          href="https://github.com/openmouse"
          target="_blank"
          rel="noreferrer"
        >
          <Download size={15} /> Download Bridge
        </a>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface BrowserWarningBannerProps {
  onDismiss: () => void;
}

export const BrowserWarningBanner: React.FC<BrowserWarningBannerProps> = ({ onDismiss }) => {
  return (
    <div className="browser-warning-bar">
      <div className="browser-warning-content">
        <AlertTriangle size={18} className="warning-icon" />
        <span className="warning-text">
          <strong>WebHID Not Supported:</strong> Your current browser (Firefox or Safari) does not support WebHID hardware communication. To configure physical gaming mice, please open OpenMouse in <strong>Google Chrome, Microsoft Edge, Brave</strong>, or install OpenMouse Bridge.
        </span>
      </div>
      <button
        type="button"
        className="warning-dismiss-btn"
        onClick={onDismiss}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};

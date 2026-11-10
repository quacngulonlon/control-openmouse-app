import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface NewsBannerProps {
  onOpenBridge?: () => void;
}

export const NewsBanner: React.FC<NewsBannerProps> = ({ onOpenBridge }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="news-banner news-banner-info">
      <Info size={15} className="news-banner-icon" />
      <a
        className="news-banner-link"
        href="#bridge"
        onClick={(e) => {
          e.preventDefault();
          onOpenBridge?.();
        }}
      >
        OpenMouse Bridge is here: Razer mice work on Windows again, plus game profiles, low-battery alerts and Firefox support. Read the announcement.
      </a>
      <button
        type="button"
        className="news-banner-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
      >
        ×
      </button>
    </div>
  );
};

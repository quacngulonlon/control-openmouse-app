import React, { useState } from 'react';
import { ShieldAlert, X, Copy, Check } from 'lucide-react';

interface UdevInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UdevInstructionsModal: React.FC<UdevInstructionsModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const script = `sudo tee /etc/udev/rules.d/99-openmouse.rules << 'EOF'
KERNEL=="hidraw*", ATTRS{idVendor}=="046d", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="1532", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="3554", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="361d", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="25a7", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="195d", MODE="0666", TAG+="uaccess"
KERNEL=="hidraw*", ATTRS{idVendor}=="3434", MODE="0666", TAG+="uaccess"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger`;

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="udev-modal-backdrop" onClick={onClose}>
      <div className="udev-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="udev-modal-head">
          <div className="udev-modal-title-row">
            <ShieldAlert size={22} color="#ff6b6b" />
            <h2 className="udev-modal-title">
              Linux Permission Required (SecurityError)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="udev-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <p className="udev-modal-desc">
          Your Linux distribution (Ubuntu / Debian / Fedora / Arch) blocked the browser from opening{' '}
          <code>/dev/hidraw*</code>. This is a default Linux security safeguard.
        </p>

        <p className="udev-modal-subdesc">
          Run the following command once in your terminal, then unplug and re-plug your mouse:
        </p>

        <pre className="udev-code-block margin-top-12">
          {script}
        </pre>

        <div className="udev-modal-foot">
          <button type="button" className="om-btn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="om-btn is-primary" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied Script!' : 'Copy Shell Script'}
          </button>
        </div>
      </div>
    </div>
  );
};

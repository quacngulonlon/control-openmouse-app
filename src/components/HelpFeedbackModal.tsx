import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ExternalLink } from 'lucide-react';

interface HelpFeedbackModalProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenUdevGuide: () => void;
}

export const HelpFeedbackModal: React.FC<HelpFeedbackModalProps> = ({ isOpen, onToggle, onOpenUdevGuide }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "My mouse isn't connecting",
      a: "Ensure your mouse or 2.4 GHz wireless dongle is plugged directly into a USB port on your computer. Click '+ Add device' and choose your mouse from the browser's WebHID permission popup. If using a wireless mouse, ensure it is turned on and awake.",
    },
    {
      q: 'DPI or polling rate won\'t change',
      a: 'Close any proprietary vendor background software (such as Razer Synapse, Logitech G HUB, or Pulsar Fusion) because they may overwrite on-board hardware registers in real time.',
    },
    {
      q: 'The app won\'t open in my browser',
      a: 'OpenMouse uses the WebHID API, which is only supported in modern Chromium browsers (Google Chrome, Microsoft Edge, Brave, Opera). Firefox and Safari do not currently support WebHID.',
    },
    {
      q: 'My settings aren\'t saving',
      a: 'OpenMouse writes configuration parameters directly to your mouse\'s on-board flash/EEPROM memory. Wait at least 1-2 seconds after tweaking settings before unplugging or turning off your mouse.',
    },
    {
      q: 'Linux: the mouse shows up but fails to open',
      a: 'On Linux distributions like Ubuntu, Fedora, or Arch, the kernel restricts write permissions to /dev/hidraw* by default. You need to configure a udev rule to grant access to your user account.',
      hasUdevLink: true,
    },
  ];

  const toggleAccordion = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <>
      {/* Floating help launcher button */}
      <button
        type="button"
        className={`om-help-launcher ${isOpen ? 'is-open' : ''}`}
        title="Help & feedback"
        aria-label="Help & feedback"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="om-help"
        onClick={onToggle}
      >
        {isOpen ? <X strokeWidth={2} aria-hidden="true" size={20} /> : <HelpCircle strokeWidth={1.9} aria-hidden="true" size={20} />}
      </button>

      {/* Opened Dialog Panel */}
      {isOpen && (
        <div id="om-help" className="om-help" role="dialog" aria-labelledby="om-help-title">
          <header className="om-help-head">
            <strong id="om-help-title">Help &amp; feedback</strong>
            <span>Quick answers &amp; troubleshooting</span>
          </header>

          <ul className="om-help-list">
            {faqs.map((faq, idx) => {
              const isItemOpen = expandedIndex === idx;
              return (
                <li key={idx} className={isItemOpen ? 'is-open' : undefined}>
                  <button
                    type="button"
                    aria-expanded={isItemOpen}
                    aria-controls={`om-help-a${idx}`}
                    onClick={() => toggleAccordion(idx)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown strokeWidth={2} aria-hidden="true" size={15} />
                  </button>
                  {isItemOpen && (
                    <div className="om-help-content-box">
                      <p id={`om-help-a${idx}`}>{faq.a}</p>
                      {faq.hasUdevLink && (
                        <button
                          type="button"
                          className="om-btn-udev-link"
                          onClick={onOpenUdevGuide}
                        >
                          Open Linux udev guide →
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <footer className="om-help-foot">
            <span>Something else</span>
            <div className="om-help-links">
              <a
                className="om-btn"
                href="https://openmouse.app/docs"
                target="_blank"
                rel="noreferrer"
              >
                <span>More answers</span> <ExternalLink strokeWidth={2} aria-hidden="true" size={14} />
              </a>
              <a
                className="om-btn om-help-discord"
                href="https://discord.gg/openmouse"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="16" height="12" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.83,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
                <span>Join the Discord</span>
              </a>
            </div>
          </footer>
        </div>
      )}
    </>
  );
};

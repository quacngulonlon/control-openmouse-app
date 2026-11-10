import React, { useState, useEffect, useRef } from 'react';
import { MousePointer, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';

export const HardwareTestView: React.FC = () => {
  const [currentHz, setCurrentHz] = useState<number>(0);
  const [peakHz, setPeakHz] = useState<number>(0);
  const [lastMovements, setLastMovements] = useState<number[]>([]);

  // Click & button test
  const [pressedButtons, setPressedButtons] = useState<Record<number, boolean>>({});
  const [clickLogs, setClickLogs] = useState<Array<{ time: number; intervalMs: number; isDouble: boolean }>>([]);
  const lastClickTimeRef = useRef<number>(0);

  // Polling rate counter ref
  const eventsCountRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const handleMouseMove = () => {
      eventsCountRef.current++;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const interval = setInterval(() => {
      const now = performance.now();
      const elapsedSec = (now - lastSampleTimeRef.current) / 1000;
      if (elapsedSec > 0.1) {
        const measuredHz = Math.round(eventsCountRef.current / elapsedSec);
        setCurrentHz(measuredHz);
        if (measuredHz > 0) {
          setPeakHz((prev) => Math.max(prev, measuredHz));
          setLastMovements((prev) => [...prev.slice(-20), measuredHz]);
        }
        eventsCountRef.current = 0;
        lastSampleTimeRef.current = now;
      }
    }, 100);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setPressedButtons((prev) => ({ ...prev, [e.button]: true }));
    const now = performance.now();
    if (lastClickTimeRef.current > 0) {
      const interval = Math.round(now - lastClickTimeRef.current);
      const isDouble = interval < 60; // double click threshold
      setClickLogs((prev) => [{ time: Date.now(), intervalMs: interval, isDouble }, ...prev.slice(0, 9)]);
    }
    lastClickTimeRef.current = now;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setPressedButtons((prev) => ({ ...prev, [e.button]: false }));
  };

  const getHzHeightClass = (hz: number) => {
    const ratio = Math.min(1, Math.max(0.1, hz / 8000));
    const step = Math.min(10, Math.max(1, Math.round(ratio * 10)));
    return `hz-h-${step}`;
  };

  return (
    <section className="page page-overview page-pad-bottom-60">
      <header className="om-page-head">
        <h1 className="page-title-h1">Hardware test</h1>
        <p className="om-meta">Live polling rate monitor, sensor stability, and double-click test.</p>
      </header>

      <div className="control-card-grid margin-top-24">
        {/* 1. Live Polling Rate Card */}
        <div className="setting-card">
          <div className="flex-between-center margin-bottom-14">
            <div>
              <h3 className="card-title-15">Real-time Polling Rate (Hz)</h3>
              <p className="card-desc-12">
                Move your mouse rapidly in circles across this window to test true transmission frequency.
              </p>
            </div>
            <button
              type="button"
              className="om-btn-sm"
              onClick={() => {
                setPeakHz(0);
                setLastMovements([]);
              }}
            >
              <RotateCcw size={13} /> Reset Peak
            </button>
          </div>

          <div className="rate-display-row">
            <div>
              <span className="rate-label-caps">Current Rate</span>
              <div className="current-rate-figure">
                {currentHz} <span className="current-rate-unit">Hz</span>
              </div>
            </div>

            <div>
              <span className="rate-label-caps">Peak Rate</span>
              <div className="peak-rate-figure">
                {peakHz} <span className="peak-rate-unit">Hz</span>
              </div>
            </div>
          </div>

          {/* Waveform / bar visualizer */}
          <div className="hz-visualizer-container">
            {lastMovements.map((hz, i) => (
              <div
                key={i}
                className={`hz-bar ${getHzHeightClass(hz)} ${hz > 900 ? 'is-high' : ''}`}
                title={`${hz} Hz`}
              />
            ))}
          </div>
        </div>

        {/* 2. Click Latency & Double-Click Tester */}
        <div className="setting-card" onContextMenu={(e) => e.preventDefault()}>
          <div className="margin-bottom-14">
            <h3 className="card-title-15">Switch Debounce &amp; Double-Click Test</h3>
            <p className="card-desc-12">
              Click inside the box below with Left, Right, or Middle buttons to check switch response and bounce.
            </p>
          </div>

          <div
            className="click-test-zone"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            <MousePointer size={24} className="click-test-icon" />
            <span className="click-test-title">Click Here To Test</span>
            <span className="click-test-sub">
              Buttons: Left ({pressedButtons[0] ? 'DOWN' : 'UP'}), Middle ({pressedButtons[1] ? 'DOWN' : 'UP'}), Right ({pressedButtons[2] ? 'DOWN' : 'UP'})
            </span>
          </div>

          {/* Recent Clicks list */}
          <div className="margin-top-16">
            <span className="click-log-title">Recent Click Intervals:</span>
            <div className="flex-col-gap6 margin-top-8">
              {clickLogs.length === 0 ? (
                <span className="click-log-empty">No clicks recorded yet.</span>
              ) : (
                clickLogs.map((log, idx) => (
                  <div key={idx} className="click-log-item">
                    <span>Click #{clickLogs.length - idx}</span>
                    <span className={`click-ms-badge ${log.isDouble ? 'is-double' : ''}`}>
                      {log.intervalMs} ms
                    </span>
                    {log.isDouble ? (
                      <span className="click-status-alert">
                        <AlertTriangle size={13} /> Rapid / Double Click
                      </span>
                    ) : (
                      <span className="click-status-ok">
                        <CheckCircle2 size={13} /> Normal Single
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

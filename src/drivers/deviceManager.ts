import { MouseDevice, MouseProfile } from '../types/mouse';
import { hardwareQueue, validateDpi, validateDebounce, validatePollingRate } from './safety';
import { LogitechHIDPPProtocol } from './protocols/logitech';
import { RazerProtocol } from './protocols/razer';
import { PulsarProtocol } from './protocols/pulsar';
import { PixartGenericProtocol } from './protocols/pixartGeneric';
import { MOCK_DEVICES, createDefaultProfile } from './mockDevices';

export interface WebHidLogEntry {
  timestamp: string;
  type: 'tx' | 'rx' | 'info' | 'error';
  vendor?: string;
  reportId?: number;
  data?: string;
  message: string;
}

export type DeviceChangeCallback = (device: MouseDevice | null) => void;
export type LogCallback = (entry: WebHidLogEntry) => void;

// Extensive list of gaming mouse Vendor IDs and Product IDs
export const SUPPORTED_VID_FILTERS: HIDDeviceFilter[] = [
  { vendorId: 0x046d }, // Logitech
  { vendorId: 0x1532 }, // Razer
  { vendorId: 0x3554 }, // Pulsar / Compx / WLmouse
  { vendorId: 0x361d }, // Finalmouse
  { vendorId: 0x3367 }, // Endgame Gear
  { vendorId: 0x3434 }, // Keychron / Ninjutso
  { vendorId: 0x25a7 }, // Attack Shark / VXE / Compx
  { vendorId: 0x195d }, // Lamzu / Compx
  { vendorId: 0x341a }, // Vaxee / Compx
  { vendorId: 0x1b4f }, // Zaunkoenig
  { vendorId: 0x3151 }, // Fantech / Compx
  { vendorId: 0x03eb }, // Wooting
];

class DeviceManager {
  private activeDevice: MouseDevice | null = null;
  private deviceChangeListeners: DeviceChangeCallback[] = [];
  private logListeners: LogCallback[] = [];
  public logs: WebHidLogEntry[] = [];
  public isWebHidSupported: boolean = typeof navigator !== 'undefined' && 'hid' in navigator;
  public securityErrorOccurred: boolean = false;

  constructor() {
    if (this.isWebHidSupported) {
      this.initHidEvents();
    }
  }

  public addLog(type: 'tx' | 'rx' | 'info' | 'error', message: string, data?: Uint8Array, reportId?: number) {
    const entry: WebHidLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      reportId,
      data: data ? Array.from(data).map((b) => b.toString(16).padStart(2, '0')).join(' ') : undefined,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
    this.logListeners.forEach((fn) => fn(entry));
  }

  public subscribeDeviceChange(cb: DeviceChangeCallback): () => void {
    this.deviceChangeListeners.push(cb);
    cb(this.activeDevice);
    return () => {
      this.deviceChangeListeners = this.deviceChangeListeners.filter((l) => l !== cb);
    };
  }

  public subscribeLogs(cb: LogCallback): () => void {
    this.logListeners.push(cb);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== cb);
    };
  }

  private notifyDeviceChange() {
    this.deviceChangeListeners.forEach((cb) => cb(this.activeDevice));
    if (this.activeDevice) {
      try {
        localStorage.setItem('active-device-id', this.activeDevice.id);
      } catch {}
    } else {
      try {
        localStorage.removeItem('active-device-id');
      } catch {}
    }
  }

  private initHidEvents() {
    navigator.hid.addEventListener('connect', (event: HIDConnectionEvent) => {
      this.addLog('info', `Device connected: ${event.device.productName || 'Unknown device'}`);
      this.autoConnect();
    });

    navigator.hid.addEventListener('disconnect', (event: HIDConnectionEvent) => {
      this.addLog('info', `Device disconnected: ${event.device.productName || 'Unknown device'}`);
      if (this.activeDevice?.rawDevice === event.device) {
        this.activeDevice = null;
        this.notifyDeviceChange();
      }
    });
  }

  public async autoConnect(): Promise<void> {
    if (!this.isWebHidSupported) return;

    try {
      const devices = await navigator.hid.getDevices();
      if (devices.length > 0) {
        const lastId = localStorage.getItem('active-device-id');
        const target = devices.find((d) => `hid-${d.vendorId}-${d.productId}` === lastId) || devices[0];
        await this.attachHidDevice(target);
      }
    } catch (e: any) {
      console.warn('Auto-connect failed:', e);
    }
  }

  public async requestDevice(): Promise<boolean> {
    if (!this.isWebHidSupported) {
      this.addLog('error', 'WebHID is not supported in this browser. Please use Chrome, Edge, Brave or Opera.');
      return false;
    }

    try {
      this.securityErrorOccurred = false;
      const selectedDevices = await navigator.hid.requestDevice({
        filters: SUPPORTED_VID_FILTERS,
      });

      if (selectedDevices && selectedDevices.length > 0) {
        return await this.attachHidDevice(selectedDevices[0]);
      }
      return false;
    } catch (err: any) {
      if (err.name === 'SecurityError') {
        this.securityErrorOccurred = true;
        this.addLog('error', 'SecurityError: Access to /dev/hidraw* is blocked by OS. Setup udev rules.');
      } else {
        this.addLog('error', `Failed to request device: ${err.message}`);
      }
      return false;
    }
  }

  public async attachHidDevice(device: HIDDevice): Promise<boolean> {
    try {
      if (!device.opened) {
        await device.open();
      }

      this.addLog('info', `Opened HID Device: ${device.productName} (VID: 0x${device.vendorId.toString(16)}, PID: 0x${device.productId.toString(16)})`);

      // Determine vendor
      let vendor: MouseDevice['vendor'] = 'Generic';
      if (device.vendorId === 0x046d) vendor = 'Logitech';
      else if (device.vendorId === 0x1532) vendor = 'Razer';
      else if (device.vendorId === 0x3554) vendor = 'Pulsar';
      else if (device.vendorId === 0x361d) vendor = 'Finalmouse';
      else if (device.vendorId === 0x25a7) vendor = 'Attack Shark';
      else if (device.vendorId === 0x195d) vendor = 'Lamzu';
      else if (device.vendorId === 0x3367) vendor = 'Endgame Gear';

      let image = './logitech-g502-x-plus.png';
      if (vendor === 'Razer') image = './razer-viper-v3-pro.png';
      else if (vendor === 'Pulsar') image = './pulsar-x2-v2.png';
      else if (vendor === 'Finalmouse') image = './finalmouse-ulx.png';
      else if (vendor === 'Attack Shark') image = './attackshark-r5-ultra.png';

      // Setup input report listener
      device.addEventListener('inputreport', (event: HIDInputReportEvent) => {
        const data = new Uint8Array(event.data.buffer);
        this.addLog('rx', `Input Report 0x${event.reportId.toString(16)}`, data, event.reportId);
        this.handleInputReport(event.reportId, data);
      });

      const mouse: MouseDevice = {
        id: `hid-${device.vendorId}-${device.productId}`,
        name: device.productName || `${vendor} Mouse`,
        vendor,
        vendorId: device.vendorId,
        productId: device.productId,
        image,
        isMock: false,
        connectionType: 'wireless_2_4ghz',
        batteryPercent: 85,
        isCharging: false,
        firmwareVersion: 'v1.0.0',
        dongleFirmwareVersion: 'v1.0.0',
        maxDpi: 26000,
        maxPollingRate: 1000,
        supportedRates: [125, 250, 500, 1000, 2000, 4000, 8000],
        activeProfileIndex: 0,
        profiles: [createDefaultProfile(1, 'Profile 1'), createDefaultProfile(2, 'Profile 2')],
        macros: [],
        rawDevice: device,
      };

      this.activeDevice = mouse;
      this.notifyDeviceChange();
      return true;
    } catch (err: any) {
      if (err.name === 'SecurityError') {
        this.securityErrorOccurred = true;
        this.addLog('error', 'Linux SecurityError: Cannot open /dev/hidraw. Follow udev rules guide.');
      } else {
        this.addLog('error', `Failed to open HID device: ${err.message}`);
      }
      return false;
    }
  }

  private handleInputReport(reportId: number, data: Uint8Array) {
    if (!this.activeDevice) return;

    if (this.activeDevice.vendor === 'Logitech' && reportId === LogitechHIDPPProtocol.REPORT_LONG) {
      // Check feature ID
      const featureIndex = data[1];
      if (featureIndex === 0x10) {
        const { percent, isCharging } = LogitechHIDPPProtocol.parseBatteryReport(data);
        this.activeDevice.batteryPercent = percent;
        this.activeDevice.isCharging = isCharging;
        this.notifyDeviceChange();
      }
    } else if (this.activeDevice.vendor === 'Razer' && reportId === RazerProtocol.REPORT_ID) {
      if (data[6] === RazerProtocol.CLASS_BATTERY) {
        const { percent, isCharging } = RazerProtocol.parseBattery(data);
        this.activeDevice.batteryPercent = percent;
        this.activeDevice.isCharging = isCharging;
        this.notifyDeviceChange();
      }
    }
  }

  public selectMockDevice(mockId: string): void {
    const mock = MOCK_DEVICES.find((m) => m.id === mockId) || MOCK_DEVICES[0];
    // Deep clone so user modifications don't mutate template
    this.activeDevice = JSON.parse(JSON.stringify(mock));
    this.addLog('info', `Activated demo mouse: ${this.activeDevice?.name}`);
    this.notifyDeviceChange();
  }

  public disconnect(): void {
    if (this.activeDevice?.rawDevice?.opened) {
      this.activeDevice.rawDevice.close().catch(() => {});
    }
    this.activeDevice = null;
    this.notifyDeviceChange();
  }

  public getActiveDevice(): MouseDevice | null {
    return this.activeDevice;
  }

  /**
   * Apply DPI Stage & Value with Hardware Mutex
   */
  public async setDpi(stageIndex: number, dpiX: number, dpiY?: number): Promise<void> {
    if (!this.activeDevice) return;

    const validatedX = validateDpi(dpiX, this.activeDevice.maxDpi);
    const validatedY = dpiY !== undefined ? validateDpi(dpiY, this.activeDevice.maxDpi) : undefined;

    const currentProfile = this.activeDevice.profiles[this.activeDevice.activeProfileIndex];
    if (currentProfile && currentProfile.dpiStages[stageIndex]) {
      currentProfile.dpiStages[stageIndex].dpi = validatedX;
      currentProfile.dpiStages[stageIndex].dpiY = validatedY;
      currentProfile.activeDpiStageIndex = stageIndex;
    }

    if (!this.activeDevice.isMock && this.activeDevice.rawDevice) {
      await hardwareQueue.enqueue(`Set DPI Stage ${stageIndex + 1} -> ${validatedX}`, async () => {
        const dev = this.activeDevice!;
        let packet: Uint8Array;
        let reportId = 0x00;

        if (dev.vendor === 'Logitech') {
          reportId = LogitechHIDPPProtocol.REPORT_LONG;
          packet = LogitechHIDPPProtocol.buildSetDpiCommand(0x06, validatedX);
          await dev.rawDevice!.sendReport(reportId, packet as any);
        } else if (dev.vendor === 'Razer') {
          reportId = RazerProtocol.REPORT_ID;
          packet = RazerProtocol.buildSetDpi(validatedX, validatedY);
          await dev.rawDevice!.sendReport(reportId, packet as any);
        } else if (dev.vendor === 'Pulsar') {
          const stages = currentProfile.dpiStages.map((s) => s.dpi);
          packet = PulsarProtocol.buildSetDpiStages(stages, stageIndex);
          await dev.rawDevice!.sendFeatureReport(reportId, packet as any);
        } else {
          packet = PixartGenericProtocol.buildDpiPacket(currentProfile.dpiStages, stageIndex);
          await dev.rawDevice!.sendReport(reportId, packet as any);
        }

        this.addLog('tx', `Set DPI ${validatedX}`, packet, reportId);
      });
    }

    this.notifyDeviceChange();
  }

  /**
   * Apply Polling Rate with Hardware Mutex
   */
  public async setPollingRate(rateHz: number): Promise<void> {
    if (!this.activeDevice) return;

    const validatedRate = validatePollingRate(rateHz, this.activeDevice.supportedRates);
    const currentProfile = this.activeDevice.profiles[this.activeDevice.activeProfileIndex];
    if (currentProfile) {
      currentProfile.pollingRateHz = validatedRate;
    }

    if (!this.activeDevice.isMock && this.activeDevice.rawDevice) {
      await hardwareQueue.enqueue(`Set Polling Rate -> ${validatedRate}Hz`, async () => {
        const dev = this.activeDevice!;
        let packet: Uint8Array;
        let reportId = 0x00;

        if (dev.vendor === 'Logitech') {
          reportId = LogitechHIDPPProtocol.REPORT_LONG;
          packet = LogitechHIDPPProtocol.buildSetReportRateCommand(0x08, validatedRate);
          await dev.rawDevice!.sendReport(reportId, packet as any);
        } else if (dev.vendor === 'Razer') {
          reportId = RazerProtocol.REPORT_ID;
          packet = RazerProtocol.buildSetPollingRate(validatedRate);
          await dev.rawDevice!.sendReport(reportId, packet as any);
        } else if (dev.vendor === 'Pulsar') {
          packet = PulsarProtocol.buildSetPollingRate(validatedRate);
          await dev.rawDevice!.sendFeatureReport(reportId, packet as any);
        } else {
          packet = PixartGenericProtocol.buildPollingRatePacket(validatedRate);
          await dev.rawDevice!.sendReport(reportId, packet as any);
        }

        this.addLog('tx', `Set Polling Rate ${validatedRate}Hz`, packet, reportId);
      });
    }

    this.notifyDeviceChange();
  }

  /**
   * Apply Sensor settings (LOD, Debounce, MotionSync, Angle Snapping, Ripple)
   */
  public async setSensor(settings: Partial<MouseProfile['sensor']>): Promise<void> {
    if (!this.activeDevice) return;
    const currentProfile = this.activeDevice.profiles[this.activeDevice.activeProfileIndex];
    if (!currentProfile) return;

    if (settings.debounceMs !== undefined) {
      settings.debounceMs = validateDebounce(settings.debounceMs);
    }

    Object.assign(currentProfile.sensor, settings);

    if (!this.activeDevice.isMock && this.activeDevice.rawDevice) {
      await hardwareQueue.enqueue('Set Sensor Settings', async () => {
        const s = currentProfile.sensor;
        const packet = PulsarProtocol.buildSetSensorSettings(
          s.lod,
          s.debounceMs,
          s.motionSync,
          s.angleSnapping,
          s.rippleControl
        );
        await this.activeDevice!.rawDevice!.sendFeatureReport(0x00, packet as any);
        this.addLog('tx', 'Set Sensor Settings', packet, 0x00);
      });
    }

    this.notifyDeviceChange();
  }

  public setProfile(profileIndex: number): void {
    if (!this.activeDevice) return;
    if (profileIndex >= 0 && profileIndex < this.activeDevice.profiles.length) {
      this.activeDevice.activeProfileIndex = profileIndex;
      this.notifyDeviceChange();
    }
  }

  public updateActiveProfile(updater: (p: MouseProfile) => void): void {
    if (!this.activeDevice) return;
    const p = this.activeDevice.profiles[this.activeDevice.activeProfileIndex];
    if (p) {
      updater(p);
      this.notifyDeviceChange();
    }
  }
}

export const deviceManager = new DeviceManager();

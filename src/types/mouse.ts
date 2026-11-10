export interface DPIStage {
  id: number;
  dpi: number;
  dpiY?: number;
  color: string; // hex
}

export interface SensorSettings {
  lod: '1mm' | '2mm';
  debounceMs: number; // 0 - 20 ms
  motionSync: boolean;
  angleSnapping: boolean;
  rippleControl: boolean;
}

export type ButtonActionType =
  | 'click_left'
  | 'click_right'
  | 'click_middle'
  | 'forward'
  | 'back'
  | 'dpi_cycle'
  | 'dpi_up'
  | 'dpi_down'
  | 'key_press'
  | 'media_play'
  | 'media_mute'
  | 'macro';

export interface ButtonMapping {
  id: string; // 'left' | 'right' | 'middle' | 'wheel_up' | 'wheel_down' | 'forward' | 'back' | 'dpi'
  name: string;
  action: ButtonActionType;
  customKey?: string;
  macroId?: string;
}

export interface MacroStep {
  id: string;
  type: 'key_down' | 'key_up' | 'delay' | 'mouse_click';
  key?: string;
  delayMs?: number;
}

export interface Macro {
  id: string;
  name: string;
  steps: MacroStep[];
}

export interface MouseProfile {
  id: number;
  name: string;
  dpiStages: DPIStage[];
  activeDpiStageIndex: number;
  separateXY: boolean;
  pollingRateHz: number; // 125, 250, 500, 1000, 2000, 4000, 8000
  sensor: SensorSettings;
  buttons: ButtonMapping[];
}

export interface MouseDevice {
  id: string;
  name: string;
  vendor: 'Logitech' | 'Razer' | 'Pulsar' | 'Finalmouse' | 'Attack Shark' | 'Lamzu' | 'Endgame Gear' | 'Generic';
  vendorId: number;
  productId: number;
  image: string;
  isMock: boolean;
  connectionType: 'wired' | 'wireless_2_4ghz';
  batteryPercent: number;
  isCharging: boolean;
  firmwareVersion: string;
  dongleFirmwareVersion?: string;
  maxDpi: number;
  maxPollingRate: number;
  supportedRates: number[];
  activeProfileIndex: number;
  profiles: MouseProfile[];
  macros: Macro[];
  rawDevice?: HIDDevice;
}

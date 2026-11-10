/**
 * Logitech HID++ Protocol Driver
 * Supports HID++ 2.0 / 4.5
 * Report IDs: 0x11 (Short - 7 bytes), 0x12 (Long - 20 bytes)
 */

export class LogitechHIDPPProtocol {
  public static REPORT_SHORT = 0x11;
  public static REPORT_LONG = 0x12;

  // Well known HID++ 2.0 feature IDs
  public static FEATURE_ROOT = 0x0000;
  public static FEATURE_FEATURE_SET = 0x0001;
  public static FEATURE_FIRMWARE = 0x0003;
  public static FEATURE_DEVICE_NAME = 0x0005;
  public static FEATURE_BATTERY_LEVEL_STATUS = 0x1000;
  public static FEATURE_BATTERY_VOLTAGE = 0x1001;
  public static FEATURE_ADJUSTABLE_DPI = 0x2201;
  public static FEATURE_REPORT_RATE = 0x8080;
  public static FEATURE_ONBOARD_PROFILES = 0x8070;

  /**
   * Build a standard HID++ 2.0 long request packet (20 bytes total, or 19 bytes without report ID)
   */
  public static buildRequest(
    deviceIndex: number,
    featureIndex: number,
    functionId: number,
    softwareId: number,
    params: number[] = []
  ): Uint8Array {
    const packet = new Uint8Array(19); // 19 bytes payload for 0x12 report
    packet[0] = deviceIndex & 0xff; // Device index (0xff for receiver, 0x01 for first device)
    packet[1] = featureIndex & 0xff;
    packet[2] = ((functionId & 0x0f) << 4) | (softwareId & 0x0f);

    for (let i = 0; i < params.length && i < 16; i++) {
      packet[3 + i] = params[i] & 0xff;
    }

    return packet;
  }

  /**
   * Create command to set current DPI stage and value
   */
  public static buildSetDpiCommand(featureIndex: number, dpiValue: number): Uint8Array {
    // Function 0x03 of Adjustable DPI feature (SetSensorDPI)
    const hi = (dpiValue >> 8) & 0xff;
    const lo = dpiValue & 0xff;
    return this.buildRequest(0x01, featureIndex, 0x03, 0x01, [0x00, hi, lo]);
  }

  /**
   * Create command to set report rate (125, 250, 500, 1000Hz)
   */
  public static buildSetReportRateCommand(featureIndex: number, rateHz: number): Uint8Array {
    // 1=1000Hz (1ms), 2=500Hz (2ms), 4=250Hz (4ms), 8=125Hz (8ms)
    let rateCode = 1;
    if (rateHz === 500) rateCode = 2;
    else if (rateHz === 250) rateCode = 4;
    else if (rateHz === 125) rateCode = 8;

    return this.buildRequest(0x01, featureIndex, 0x02, 0x01, [rateCode]);
  }

  /**
   * Parse Battery Level Report from Feature 0x1000
   */
  public static parseBatteryReport(data: Uint8Array): { percent: number; isCharging: boolean } {
    if (data.length < 5) return { percent: 85, isCharging: false };
    const percent = Math.min(100, Math.max(0, data[3]));
    const chargingStatus = data[4];
    const isCharging = chargingStatus === 1 || chargingStatus === 2; // Charging or charging complete
    return { percent, isCharging };
  }

  /**
   * Parse DPI Sensor Info from Feature 0x2201
   */
  public static parseDpiReport(data: Uint8Array): { currentDpi: number; maxDpi: number } {
    if (data.length < 6) return { currentDpi: 800, maxDpi: 25600 };
    const currentDpi = (data[4] << 8) | data[5];
    return { currentDpi: currentDpi || 800, maxDpi: 25600 };
  }
}

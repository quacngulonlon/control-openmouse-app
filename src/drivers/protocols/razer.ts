import { calculateXorChecksum } from '../safety';

/**
 * Razer HID Protocol Driver
 * Packet length: 90 bytes
 * Report ID: 0x02 (sometimes 0x00)
 */

export class RazerProtocol {
  public static REPORT_ID = 0x02;
  public static PACKET_SIZE = 90;

  // Command Classes
  public static CLASS_DEVICE = 0x00;
  public static CLASS_MOUSE = 0x04;
  public static CLASS_BATTERY = 0x07;
  public static CLASS_CUSTOM = 0x0f;

  /**
   * Build a 90-byte Razer HID packet with proper XOR checksum
   */
  public static buildPacket(
    commandClass: number,
    commandId: number,
    args: number[] = [],
    transactionId = 0x1f
  ): Uint8Array {
    const packet = new Uint8Array(this.PACKET_SIZE);

    packet[0] = 0x00; // Status: new command
    packet[1] = transactionId & 0xff;
    packet[2] = 0x00; // Remaining packets high
    packet[3] = 0x00; // Remaining packets low
    packet[4] = 0x00; // Protocol type
    packet[5] = args.length & 0xff; // Data size
    packet[6] = commandClass & 0xff;
    packet[7] = commandId & 0xff;

    for (let i = 0; i < args.length && i < 80; i++) {
      packet[8 + i] = args[i] & 0xff;
    }

    // Checksum: XOR from byte 2 up to 87
    packet[88] = calculateXorChecksum(packet, 2, 88);
    packet[89] = 0x00; // Reserved

    return packet;
  }

  /**
   * Build command to set DPI (X and Y separately or synchronized)
   */
  public static buildSetDpi(dpiX: number, dpiY?: number): Uint8Array {
    const y = dpiY !== undefined ? dpiY : dpiX;
    // Command class 0x04, ID 0x05 (Set DPI X/Y)
    const hiX = (dpiX >> 8) & 0xff;
    const loX = dpiX & 0xff;
    const hiY = (y >> 8) & 0xff;
    const loY = y & 0xff;
    return this.buildPacket(this.CLASS_MOUSE, 0x05, [0x00, hiX, loX, hiY, loY]);
  }

  /**
   * Build command to set Polling Rate (125, 250, 500, 1000, 2000, 4000, 8000Hz)
   */
  public static buildSetPollingRate(rateHz: number): Uint8Array {
    // Razer rates: 0x01=1000Hz, 0x02=500Hz, 0x08=125Hz, 0x10=2000Hz, 0x20=4000Hz, 0x40=8000Hz
    let code = 0x01;
    switch (rateHz) {
      case 8000: code = 0x40; break;
      case 4000: code = 0x20; break;
      case 2000: code = 0x10; break;
      case 1000: code = 0x01; break;
      case 500: code = 0x02; break;
      case 250: code = 0x04; break;
      case 125: code = 0x08; break;
    }
    return this.buildPacket(this.CLASS_DEVICE, 0x05, [code]);
  }

  /**
   * Build command to query Battery Level
   */
  public static buildGetBattery(): Uint8Array {
    return this.buildPacket(this.CLASS_BATTERY, 0x80, []);
  }

  /**
   * Parse Razer battery response
   */
  public static parseBattery(data: Uint8Array): { percent: number; isCharging: boolean } {
    if (data.length < 10) return { percent: 90, isCharging: false };
    // Battery % is typically at byte 9 (scale 0-255 or 0-100)
    let percent = data[9];
    if (percent > 100) {
      percent = Math.round((percent / 255) * 100);
    }
    const isCharging = data[10] === 0x01;
    return { percent: Math.max(0, Math.min(100, percent)), isCharging };
  }
}

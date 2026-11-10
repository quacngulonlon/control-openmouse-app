/**
 * Pulsar & Compx Protocol Driver
 * Uses 64-byte HID feature reports
 */

export class PulsarProtocol {
  public static REPORT_ID = 0x00;
  public static PACKET_SIZE = 64;

  public static CMD_GET_INFO = 0x01;
  public static CMD_SET_DPI = 0x02;
  public static CMD_SET_RATE = 0x03;
  public static CMD_SET_SENSOR = 0x04;
  public static CMD_SET_BUTTONS = 0x05;

  public static buildPacket(cmd: number, subCmd: number, payload: number[] = []): Uint8Array {
    const packet = new Uint8Array(this.PACKET_SIZE);
    packet[0] = 0x04; // Header magic
    packet[1] = cmd & 0xff;
    packet[2] = subCmd & 0xff;
    packet[3] = payload.length & 0xff;

    for (let i = 0; i < payload.length && i < 58; i++) {
      packet[4 + i] = payload[i] & 0xff;
    }

    return packet;
  }

  public static buildSetDpiStages(stages: number[], activeIndex: number): Uint8Array {
    const payload = [activeIndex & 0xff, stages.length & 0xff];
    for (const dpi of stages) {
      payload.push((dpi >> 8) & 0xff);
      payload.push(dpi & 0xff);
    }
    return this.buildPacket(this.CMD_SET_DPI, 0x01, payload);
  }

  public static buildSetSensorSettings(
    lod: '1mm' | '2mm',
    debounceMs: number,
    motionSync: boolean,
    angleSnapping: boolean,
    rippleControl: boolean
  ): Uint8Array {
    const lodCode = lod === '1mm' ? 1 : 2;
    return this.buildPacket(this.CMD_SET_SENSOR, 0x01, [
      lodCode,
      debounceMs & 0xff,
      motionSync ? 1 : 0,
      angleSnapping ? 1 : 0,
      rippleControl ? 1 : 0,
    ]);
  }

  public static buildSetPollingRate(rateHz: number): Uint8Array {
    let rateIndex = 3; // default 1000Hz
    switch (rateHz) {
      case 125: rateIndex = 0; break;
      case 250: rateIndex = 1; break;
      case 500: rateIndex = 2; break;
      case 1000: rateIndex = 3; break;
      case 2000: rateIndex = 4; break;
      case 4000: rateIndex = 5; break;
      case 8000: rateIndex = 6; break;
    }
    return this.buildPacket(this.CMD_SET_RATE, 0x01, [rateIndex]);
  }
}

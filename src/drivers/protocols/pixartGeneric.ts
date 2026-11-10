/**
 * Generic PixArt PAW3395/3950 & Nordic 52840 Protocol
 * Used by Attack Shark, VXE, Lamzu, Ninjutso, Finalmouse ULX
 */

export class PixartGenericProtocol {
  public static PACKET_SIZE = 64;

  public static buildDpiPacket(stages: { dpi: number; colorHex?: string }[], activeStage: number): Uint8Array {
    const data = new Uint8Array(this.PACKET_SIZE);
    data[0] = 0x07; // Report indicator / magic
    data[1] = 0x02; // DPI command
    data[2] = activeStage & 0x0f;
    data[3] = stages.length & 0x0f;

    let offset = 4;
    for (let i = 0; i < stages.length && i < 6; i++) {
      const dpi = stages[i].dpi;
      data[offset++] = (dpi >> 8) & 0xff;
      data[offset++] = dpi & 0xff;
    }

    return data;
  }

  public static buildSensorPacket(lod: '1mm' | '2mm', debounce: number, motionSync: boolean): Uint8Array {
    const data = new Uint8Array(this.PACKET_SIZE);
    data[0] = 0x07;
    data[1] = 0x04; // Sensor command
    data[2] = lod === '1mm' ? 0x01 : 0x02;
    data[3] = Math.max(0, Math.min(20, debounce));
    data[4] = motionSync ? 0x01 : 0x00;
    return data;
  }

  public static buildPollingRatePacket(rateHz: number): Uint8Array {
    const data = new Uint8Array(this.PACKET_SIZE);
    data[0] = 0x07;
    data[1] = 0x03; // Polling rate command
    let val = 3;
    if (rateHz === 125) val = 0;
    else if (rateHz === 250) val = 1;
    else if (rateHz === 500) val = 2;
    else if (rateHz === 1000) val = 3;
    else if (rateHz === 2000) val = 4;
    else if (rateHz === 4000) val = 5;
    else if (rateHz === 8000) val = 6;
    data[2] = val;
    return data;
  }
}

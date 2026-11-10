/**
 * Hardware Safety Layer
 * - Serialized Mutex / Command Queue
 * - Request Timeout to prevent hanging
 * - Packet and parameter validation
 */

export interface QueuedCommand<T = unknown> {
  id: string;
  description: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  timeoutMs: number;
}

export class HardwareCommandQueue {
  private queue: QueuedCommand<any>[] = [];
  private isProcessing = false;
  private defaultTimeoutMs = 1500;

  /**
   * Enqueue a command to be executed serially
   */
  public enqueue<T>(description: string, execute: () => Promise<T>, timeoutMs?: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const command: QueuedCommand<T> = {
        id: Math.random().toString(36).substring(2, 9),
        description,
        execute,
        resolve,
        reject,
        timeoutMs: timeoutMs || this.defaultTimeoutMs,
      };

      this.queue.push(command);
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const command = this.queue.shift()!;

    let timeoutHandle: number | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = window.setTimeout(() => {
        reject(new Error(`Command '${command.description}' timed out after ${command.timeoutMs}ms`));
      }, command.timeoutMs);
    });

    try {
      const result = await Promise.race([command.execute(), timeoutPromise]);
      window.clearTimeout(timeoutHandle);
      command.resolve(result);
    } catch (err) {
      window.clearTimeout(timeoutHandle);
      console.warn(`[HardwareSafety] Failed command "${command.description}":`, err);
      command.reject(err);
    } finally {
      this.isProcessing = false;
      // Slight delay between raw HID packets to give mouse MCU time to commit to flash
      setTimeout(() => {
        this.processNext();
      }, 20);
    }
  }

  public clear() {
    this.queue.forEach((cmd) => cmd.reject(new Error('Queue cleared')));
    this.queue = [];
    this.isProcessing = false;
  }
}

export const hardwareQueue = new HardwareCommandQueue();

/**
 * Parameter Validation Helpers
 */
export function validateDpi(dpi: number, maxDpi = 30000, step = 50): number {
  if (typeof dpi !== 'number' || isNaN(dpi)) {
    throw new Error('DPI must be a valid number');
  }
  const clamped = Math.max(50, Math.min(maxDpi, dpi));
  // Round to nearest step
  return Math.round(clamped / step) * step;
}

export function validateDebounce(ms: number): number {
  if (typeof ms !== 'number' || isNaN(ms)) return 4;
  return Math.max(0, Math.min(20, Math.round(ms)));
}

export function validatePollingRate(rate: number, allowedRates: number[] = [125, 250, 500, 1000, 2000, 4000, 8000]): number {
  if (!allowedRates.includes(rate)) {
    return 1000;
  }
  return rate;
}

/**
 * Checksum helpers
 */
export function calculateXorChecksum(data: Uint8Array, start = 0, end?: number): number {
  let checksum = 0;
  const stop = end ?? data.length;
  for (let i = start; i < stop; i++) {
    checksum ^= data[i];
  }
  return checksum;
}

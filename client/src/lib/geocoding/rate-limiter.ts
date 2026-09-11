/**
 * Strict Rate Limiter for external geocoding requests.
 * Ensures compliance with OpenStreetMap Nominatim usage policies
 * (maximum 1 request per second, non-spammy queue pacing).
 */
export class RateLimiter {
  private readonly minIntervalMs: number;
  private lastRequestTime = 0;
  private queue: Array<{
    task: () => Promise<any>;
    resolve: (val: any) => void;
    reject: (err: any) => void;
  }> = [];
  private isProcessing = false;

  constructor(minIntervalMs = 1000) {
    this.minIntervalMs = Math.max(100, minIntervalMs);
  }

  /**
   * Schedules a task to be executed observing the minimum interval spacing.
   */
  schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.minIntervalMs - elapsed);

    if (waitTime > 0) {
      await new Promise((res) => setTimeout(res, waitTime));
    }

    const next = this.queue.shift();
    if (!next) {
      this.isProcessing = false;
      return;
    }

    this.lastRequestTime = Date.now();

    try {
      const result = await next.task();
      next.resolve(result);
    } catch (err) {
      next.reject(err);
    }

    // Continue processing subsequent tasks
    this.processQueue();
  }

  get queueLength(): number {
    return this.queue.length;
  }

  get lastCallTime(): number {
    return this.lastRequestTime;
  }
}

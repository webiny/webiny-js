const DEFAULT_DURATION_MS = 14 * 60 * 1000;

export class CountdownTimer {
    private readonly startTime: number;
    private readonly durationMs: number;

    public constructor(durationMs = DEFAULT_DURATION_MS) {
        this.startTime = Date.now();
        this.durationMs = durationMs;
    }

    public getRemainingMilliseconds(): number {
        return this.startTime + this.durationMs - Date.now();
    }
}

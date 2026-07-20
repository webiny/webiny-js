import type { Timer } from "@webiny/utils/features/Timer/abstraction.js";

const DEFAULT_MAX_DURATION_MS = 86_400_000; /* 24 hours. */

export class ProcessTimer implements Timer.Interface {
    private readonly startTime: [number, number];
    private readonly maxDurationMs: number;

    public constructor(maxDurationMs: number = DEFAULT_MAX_DURATION_MS) {
        this.startTime = process.hrtime();
        this.maxDurationMs = maxDurationMs;
    }

    public getRemainingMilliseconds(): number {
        const elapsed = process.hrtime(this.startTime);
        const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1_000_000;
        const remaining = this.maxDurationMs - elapsedMs;
        return remaining > 0 ? remaining : 0;
    }

    public getRemainingSeconds(): number {
        return Math.floor(this.getRemainingMilliseconds() / 1000);
    }
}

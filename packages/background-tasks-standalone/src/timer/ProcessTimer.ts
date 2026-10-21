import type { Timer } from "@webiny/utils/features/Timer/abstraction.js";

const DEFAULT_MAX_DURATION_MS = 86_400_000; /* 24 hours. */

export class ProcessTimer implements Timer.Interface {
    private readonly startTime: [number, number];
    private readonly maxDurationMs: number;
    private expired = false;

    public constructor(maxDurationMs: number = DEFAULT_MAX_DURATION_MS) {
        this.startTime = process.hrtime();
        this.maxDurationMs = maxDurationMs;
    }

    /**
     * Runs the time out now. A task that checks `isCloseToTimeout()` then saves its progress and
     * hands back control, as it would before a Lambda's time runs out.
     */
    public expire(): void {
        this.expired = true;
    }

    public getRemainingMilliseconds(): number {
        if (this.expired) {
            return 0;
        }
        const elapsed = process.hrtime(this.startTime);
        const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1_000_000;
        const remaining = this.maxDurationMs - elapsedMs;
        return remaining > 0 ? remaining : 0;
    }

    public getRemainingSeconds(): number {
        return Math.floor(this.getRemainingMilliseconds() / 1000);
    }
}

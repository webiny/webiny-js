import type { ITimer } from "./abstractions/ITimer.js";

/**
 * Used in long-running runtimes (e.g., container) where there is no execution-time
 * limit. Always reports `Infinity` remaining, so callers that branch on
 * `isCloseToTimeout` never trigger checkpoint/resume logic.
 */
export class InfiniteTimer implements ITimer {
    public getRemainingMilliseconds(): number {
        return Number.POSITIVE_INFINITY;
    }

    public getRemainingSeconds(): number {
        return Number.POSITIVE_INFINITY;
    }
}

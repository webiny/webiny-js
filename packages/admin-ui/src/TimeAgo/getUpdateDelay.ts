import type { UpdateIntervals } from "./types.js";

const MINUTE = 60;
const HOUR = 3600;
const FIVE_MINUTES = 5 * MINUTE;
const FIFTEEN_MINUTES = 15 * MINUTE;

export const DEFAULT_INTERVALS: Required<UpdateIntervals> = {
    underFiveMinutes: 1_000,
    underFifteenMinutes: 10_000,
    underOneHour: 30_000
};

export function getUpdateDelay(
    seconds: number,
    minInterval?: number,
    intervals: Required<UpdateIntervals> = DEFAULT_INTERVALS
): number | null {
    const abs = Math.abs(seconds);
    let delay: number;

    if (abs < FIVE_MINUTES) {
        delay = intervals.underFiveMinutes;
    } else if (abs < FIFTEEN_MINUTES) {
        delay = intervals.underFifteenMinutes;
    } else if (abs < HOUR) {
        delay = intervals.underOneHour;
    } else {
        return null;
    }

    if (minInterval) {
        delay = Math.max(delay, minInterval * 1000);
    }

    return delay;
}

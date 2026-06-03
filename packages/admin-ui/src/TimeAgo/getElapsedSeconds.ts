import type { TDate } from "./types.js";
import { toEpochMs } from "./toEpochMs.js";

export function getElapsedSeconds(datetime: TDate, relativeDate?: TDate): number {
    const nowMs = relativeDate ? toEpochMs(relativeDate) : Date.now();
    const pastMs = toEpochMs(datetime);
    return Math.round((nowMs - pastMs) / 1000);
}

import type { TDate } from "./types.js";
import { toEpochMs } from "./toEpochMs.js";

export function getElapsedSeconds(datetime: TDate, relativeDate?: TDate): number {
    const now = relativeDate
        ? Temporal.Instant.fromEpochMilliseconds(toEpochMs(relativeDate))
        : Temporal.Now.instant();
    const past = Temporal.Instant.fromEpochMilliseconds(toEpochMs(datetime));
    return Math.round(now.since(past).total("second"));
}

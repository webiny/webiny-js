import { getZonedDateParts } from "./getZonedDateParts.js";

const MILLISECONDS_PER_SECOND = 1000;

/*
 * The offset of `timeZone` from UTC at `instant`, in milliseconds (local minus UTC: 7200000 for
 * CEST). `formatToParts` has no millisecond part, so the instant is truncated to its whole second
 * before it is compared with the wall time; otherwise the offset of `…:59.999` is off by 999 ms
 * and an end of day lands on the next local day (R319). The remainder is kept non-negative so an
 * instant before 1970 truncates the same way.
 */
export const getTimeZoneOffset = (instant: number, timeZone: string): number => {
    const parts = getZonedDateParts(instant, timeZone);
    const wallTime = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    );
    const remainder =
        ((instant % MILLISECONDS_PER_SECOND) + MILLISECONDS_PER_SECOND) % MILLISECONDS_PER_SECOND;
    const wholeSecond = instant - remainder;

    return wallTime - wholeSecond;
};

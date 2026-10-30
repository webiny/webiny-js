import { getTimeZoneOffset } from "./getTimeZoneOffset.js";
import { getZonedDateParts } from "./getZonedDateParts.js";

/*
 * The UTC ISO string of 23:59:59.999 on `date` (`yyyy-MM-dd`) in `timeZone` (R319, D179). The
 * offset is read at the wall time taken as UTC and re-checked at the result, so on a day the zone
 * changes its offset the end still falls at 23:59:59.999 local. When the clock goes back at local
 * midnight, 23:59:59.999 occurs twice and the later one is used: it is the last instant whose
 * local date is still the picked day.
 */
export const getEndOfLocalDay = (date: string, timeZone: string): string => {
    const [year, month, day] = date.split("-").map(Number);
    const wallTime = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
    const firstOffset = getTimeZoneOffset(wallTime, timeZone);
    let instant = wallTime - firstOffset;

    const checkedOffset = getTimeZoneOffset(instant, timeZone);
    if (checkedOffset !== firstOffset) {
        instant = wallTime - checkedOffset;
    }

    const offsetAfter = getTimeZoneOffset(instant + 1, timeZone);
    const laterInstant = wallTime - offsetAfter;
    if (laterInstant > instant) {
        const parts = getZonedDateParts(laterInstant, timeZone);
        const isSameWallTime =
            parts.year === year &&
            parts.month === month &&
            parts.day === day &&
            parts.hour === 23 &&
            parts.minute === 59 &&
            parts.second === 59;
        if (isSameWallTime) {
            instant = laterInstant;
        }
    }

    return new Date(instant).toISOString();
};

import { getTimeZoneOffset } from "./getTimeZoneOffset.js";

/*
 * The UTC ISO string of 23:59:59.999 on `date` (`yyyy-MM-dd`) in `timeZone` (R319, D179). The
 * offset is read at the wall time taken as UTC and re-checked at the result, so on a day the zone
 * changes its offset the end still falls at 23:59:59.999 local.
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

    return new Date(instant).toISOString();
};

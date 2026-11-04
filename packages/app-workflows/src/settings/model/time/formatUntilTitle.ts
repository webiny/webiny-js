import { formatZonedDate } from "./formatZonedDate.js";
import { formatZonedTime } from "./formatZonedTime.js";
import { getZonedDateParts } from "./getZonedDateParts.js";
import { UNTIL_REMOVED_LABEL } from "./timeTexts.js";

/*
 * The Until cell's hover (R320, QBZ-95): `{Ddd} {d} {Mon} {yyyy}, {HH:mm} {zone} ({IANA zone})`,
 * e.g. `Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)`. Built from the parts, because ICU writes a
 * comma after the weekday and the design does not. `Until removed` without a date.
 */
export const formatUntilTitle = (endsOn: string | null, timeZone: string): string => {
    if (endsOn === null) {
        return UNTIL_REMOVED_LABEL;
    }
    const instant = Date.parse(endsOn);
    const parts = getZonedDateParts(instant, timeZone);
    const date = formatZonedDate(parts);
    const time = formatZonedTime(parts);

    return `${parts.weekday} ${date}, ${time} ${parts.zoneName} (${timeZone})`;
};

import { formatZonedDate } from "./formatZonedDate.js";
import { formatZonedTime } from "./formatZonedTime.js";
import { getZonedDateParts } from "./getZonedDateParts.js";
import { UNTIL_REMOVED_LABEL } from "./timeTexts.js";

/*
 * The Until cell (R320, QBZ-95): `Until removed` without a date; `End of {d Mon yyyy}` when the end
 * falls in the 23:59 minute of the viewer's zone; else `{d Mon yyyy}, {HH:mm}` in that zone.
 */
export const formatUntilLabel = (endsOn: string | null, timeZone: string): string => {
    if (endsOn === null) {
        return UNTIL_REMOVED_LABEL;
    }
    const instant = Date.parse(endsOn);
    const parts = getZonedDateParts(instant, timeZone);
    const date = formatZonedDate(parts);

    if (parts.hour === 23 && parts.minute === 59) {
        return `End of ${date}`;
    }

    const time = formatZonedTime(parts);
    return `${date}, ${time}`;
};

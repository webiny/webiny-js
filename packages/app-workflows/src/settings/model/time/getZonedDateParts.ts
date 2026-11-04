import type { ZonedDateParts } from "./ZonedDateParts.js";

const readPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string => {
    const part = parts.find(candidate => candidate.type === type);
    if (!part) {
        return "";
    }
    return part.value;
};

/*
 * The wall-clock fields of `instant` in `timeZone` from one `en-GB` `formatToParts` call (R319,
 * R320). `hourCycle: "h23"` makes midnight hour 0. There is no millisecond part; callers that
 * compare with the instant truncate it to its second (`getTimeZoneOffset`).
 */
export const getZonedDateParts = (instant: number, timeZone: string): ZonedDateParts => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        weekday: "short",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZoneName: "short"
    });
    const parts = formatter.formatToParts(instant);
    const year = readPart(parts, "year");
    const month = readPart(parts, "month");
    const day = readPart(parts, "day");
    const hour = readPart(parts, "hour");
    const minute = readPart(parts, "minute");
    const second = readPart(parts, "second");

    return {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second),
        weekday: readPart(parts, "weekday"),
        zoneName: readPart(parts, "timeZoneName")
    };
};

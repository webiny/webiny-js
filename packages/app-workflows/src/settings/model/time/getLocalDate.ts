import { getZonedDateParts } from "./getZonedDateParts.js";

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

// The `yyyy-MM-dd` of an ISO instant in `timeZone`: the date the Edit dialog pre-fills (R319).
export const getLocalDate = (instant: string, timeZone: string): string => {
    const time = Date.parse(instant);
    const parts = getZonedDateParts(time, timeZone);
    const month = pad(parts.month);
    const day = pad(parts.day);

    return `${parts.year}-${month}-${day}`;
};

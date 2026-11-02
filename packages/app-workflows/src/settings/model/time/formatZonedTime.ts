import type { ZonedDateParts } from "./ZonedDateParts.js";

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

// The 24-hour `HH:mm` of the until label and hover (R320).
export const formatZonedTime = (parts: ZonedDateParts): string => {
    const hour = pad(parts.hour);
    const minute = pad(parts.minute);
    return `${hour}:${minute}`;
};

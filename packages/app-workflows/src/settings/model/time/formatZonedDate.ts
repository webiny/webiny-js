import type { ZonedDateParts } from "./ZonedDateParts.js";
import { SHORT_MONTH_NAMES } from "./timeTexts.js";

// The `d Mon yyyy` of the until label and hover, with the fixed month names (R320, R339).
export const formatZonedDate = (parts: ZonedDateParts): string => {
    const month = SHORT_MONTH_NAMES[parts.month - 1];
    return `${parts.day} ${month} ${parts.year}`;
};

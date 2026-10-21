import { REASON_MAX_LENGTH } from "~/settings/model/constants.js";

/*
 * The reason a save sends (R328, Q65): trimmed; `null` when nothing is left; cut to 500 characters
 * after trimming. The input's `maxLength` already stops typing past 500; the cut covers pasted or
 * loaded text.
 */
export const normaliseReason = (reason: string): string | null => {
    const trimmed = reason.trim();
    if (trimmed === "") {
        return null;
    }
    if (trimmed.length > REASON_MAX_LENGTH) {
        return trimmed.slice(0, REASON_MAX_LENGTH);
    }
    return trimmed;
};

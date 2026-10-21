import { NOTIFICATION_COMMENT_MAX_LENGTH } from "~/domain/notifications/constants.js";

/**
 * The rejection comment as a message shows it (R189a): trimmed, and cut so that the result,
 * including the appended `…`, is at most `NOTIFICATION_COMMENT_MAX_LENGTH` code points. Counted by
 * code point, so an emoji is never split. Pure.
 */
export const clampComment = (comment: string): string => {
    const trimmed = comment.trim();
    const characters = Array.from(trimmed);
    if (characters.length <= NOTIFICATION_COMMENT_MAX_LENGTH) {
        return trimmed;
    }
    const kept = characters.slice(0, NOTIFICATION_COMMENT_MAX_LENGTH - 1).join("");
    return `${kept.trimEnd()}…`;
};

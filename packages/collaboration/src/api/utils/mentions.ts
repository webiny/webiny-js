import { MAX_MENTION_ID_LENGTH, MAX_MENTIONS } from "~/shared/constants.js";

/**
 * Security: de-duplicates mentions, drops empty / oversized ids and caps the count, so use cases
 * called outside GraphQL (which validates the same limits) cannot fan out unbounded notifications.
 */
export const normalizeMentions = (mentions: string[] | null | undefined): string[] => {
    const result = new Set<string>();
    for (const id of mentions || []) {
        if (result.size >= MAX_MENTIONS) {
            break;
        }
        if (typeof id !== "string" || !id || id.length > MAX_MENTION_ID_LENGTH) {
            continue;
        }
        result.add(id);
    }
    return Array.from(result);
};

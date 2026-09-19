import { hashValue } from "~/core/hashing/hashValue.js";

/**
 * Removes every `_id` from a value tree, at every depth.
 *
 * Item ids are identity, not content, and diffing has to be able to ask "is this the same content?"
 * separately from "is this the same item?". Two cases need it:
 *
 *   - **Id churn.** An import or migration rewrites ids while leaving content alone. Comparing
 *     id-bearing hashes would make every block look replaced; comparing content hashes recognises
 *     the block that reappeared under a new id.
 *   - **Identity being established.** Every entry written before stable ids carries none until its
 *     next save. Its items must line up with their id-bearing counterparts by content, or the
 *     first save after the upgrade reports the whole entry as rewritten.
 *
 * `_templateId` is deliberately *not* stripped: swapping a dynamic-zone block's template is a real
 * change, and one worth reporting.
 */
export const stripIds = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(stripIds);
    }

    // Dates are objects but not containers; recursing into one would destroy it.
    if (value === null || typeof value !== "object" || value instanceof Date) {
        return value;
    }

    const out: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (key === "_id") {
            continue;
        }
        out[key] = stripIds(child);
    }

    return out;
};

/**
 * Hash of a value's content, ignoring item identity.
 *
 * This is the hash the differ compares. Equal content hashes mean the subtree can be skipped
 * without descending — the short-circuit that keeps a diff proportional to what changed rather
 * than to the size of the entry.
 */
export const contentHash = (value: unknown): string => {
    return hashValue(stripIds(value));
};

import type { IEnrichmentOutput } from "./abstractions.js";

/**
 * Normalises one value from `streamText`'s `partialOutputStream`.
 *
 * Partial output is exactly that: mid-stream the tag array can hold holes/undefined entries and the
 * description may not have arrived, so callers get only the values that are actually present.
 */
export function readEnrichmentPartial(partial: unknown): IEnrichmentOutput {
    const value = (partial ?? {}) as { tags?: unknown; description?: unknown };

    const tags: string[] = [];

    if (Array.isArray(value.tags)) {
        for (const tag of value.tags) {
            // Empty strings are dropped, not just non-strings: mid-stream the array can hold `""`
            // for an entry the model has opened but not written into yet, which renders as a blank
            // chip.
            if (typeof tag === "string" && tag !== "") {
                tags.push(tag);
            }
        }
    }

    let description = "";

    if (typeof value.description === "string") {
        description = value.description;
    }

    return { tags, description };
}

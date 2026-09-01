import type { IEnrichmentOutput } from "./abstractions.js";

/**
 * Normalises one value from `streamText`'s `partialOutputStream`.
 *
 * Partial output is exactly that: mid-stream the tag array can hold holes/undefined entries and the
 * description may not have arrived, so callers get only the values that are actually present.
 */
export function readEnrichmentPartial(partial: unknown): IEnrichmentOutput {
    const value = (partial ?? {}) as { tags?: unknown; description?: unknown };

    const tags = Array.isArray(value.tags)
        ? value.tags.filter((tag: unknown): tag is string => typeof tag === "string")
        : [];

    const description = typeof value.description === "string" ? value.description : "";

    return { tags, description };
}

/**
 * Point a page's images at the copies in File Manager instead of at the host that served them.
 *
 * Deliberately the same shape as `rewriteDestinations`, which answers the same question about a
 * different kind of reference: a three-way outcome, a discard entry for what is left behind, and
 * counters beside the link counters. Two mechanisms answering one question is the pattern that has
 * produced most of this project's bugs.
 *
 * The difference from destinations is what "external" means. A destination on another host is
 * genuinely someone else's page and stays. An image on another host is usually the whole point — the
 * imagery on these sites lives on the previous vendor's CDN — so the question is not which host
 * serves it but whether this migration has a copy. If it does, the binding points at the copy. If it
 * does not, the binding is left exactly as it was and recorded, because a hotlink nobody knows about
 * is the failure this work exists to prevent.
 */

/** What happened to one image binding. */
export type ImageSourceOutcome =
    /** Repointed at this migration's copy in File Manager. */
    | { kind: "rewritten"; elementId: string; path: string; from: string; to: string }
    /** No copy was migrated, so it still points at the original host. Flagged, never silent. */
    | { kind: "unmigrated"; elementId: string; path: string; url: string };

export interface ImageRewriteResult {
    bindings: Record<string, any>;
    outcomes: ImageSourceOutcome[];
}

/**
 * The url a file-typed binding carries, whichever shape it is in.
 *
 * A component reads either the object or the bare string — the corpus was generated under both rules
 * and the component's source decides which (see `fileInputShape`). Both are recognised here, and a
 * rewrite puts the new url back in the shape it found, so repointing an image can never change
 * whether that component renders it.
 */
const readUrl = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value.trim() ? value : null;
    }
    if (value && typeof value === "object") {
        const record = value as { url?: unknown; src?: unknown };
        const url = record.url ?? record.src;
        return typeof url === "string" && url.trim() ? url : null;
    }
    return null;
};

/** The same value with a new url, in the shape it arrived in. */
const writeUrl = (value: unknown, url: string): unknown => {
    if (typeof value === "string") {
        return url;
    }
    const record = value as Record<string, unknown>;
    // Whichever key carried the url is the one the component reads; the other is left untouched.
    return "url" in record ? { ...record, url } : { ...record, src: url };
};

export const rewriteImageSources = (params: {
    bindings: Record<string, any>;
    /** The migrated url for a captured source url, or null when this migration has no copy. */
    resolve: (sourceUrl: string) => string | null;
}): ImageRewriteResult => {
    const { bindings, resolve } = params;
    const outcomes: ImageSourceOutcome[] = [];
    const next: Record<string, any> = {};

    for (const [elementId, element] of Object.entries(bindings)) {
        const inputs = (element as { inputs?: Record<string, any> })?.inputs;
        if (!inputs) {
            next[elementId] = element;
            continue;
        }

        const nextInputs: Record<string, any> = {};
        for (const [path, binding] of Object.entries(inputs)) {
            if ((binding as { type?: unknown })?.type !== "file") {
                nextInputs[path] = binding;
                continue;
            }

            const value = (binding as { static?: unknown })?.static;
            const url = readUrl(value);
            if (!url) {
                // An empty slot: nothing to repoint, and nothing missing that was not already known.
                nextInputs[path] = binding;
                continue;
            }

            const migrated = resolve(url);
            if (!migrated) {
                outcomes.push({ kind: "unmigrated", elementId, path, url });
                nextInputs[path] = binding;
                continue;
            }

            outcomes.push({ kind: "rewritten", elementId, path, from: url, to: migrated });
            nextInputs[path] = { ...(binding as object), static: writeUrl(value, migrated) };
        }

        next[elementId] = { ...(element as object), inputs: nextInputs };
    }

    return { bindings: next, outcomes };
};

/** Counts for the page map, in the shape it already reports links. */
export const tallyImageSources = (outcomes: ImageSourceOutcome[]) => ({
    rewritten: outcomes.filter(outcome => outcome.kind === "rewritten").length,
    unmigrated: outcomes.filter(outcome => outcome.kind === "unmigrated").length
});

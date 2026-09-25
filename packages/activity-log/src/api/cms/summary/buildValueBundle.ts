import type { SummaryValueEntry } from "~/api/core/types.js";
import { splitPathSegments } from "~/api/core/paths.js";

/**
 * Reads the value a changeset path points at.
 *
 * Mirrors how `encodePath` builds them: a bare segment is a field, `#id` matches an item by its
 * `_id`, `[n]` is positional. Returns `undefined` for anything that does not resolve, which is the
 * ordinary answer for a path that was added or removed rather than edited.
 */
export const valueAtPath = (root: unknown, path: string): unknown => {
    let current: unknown = root;

    for (const segment of splitPathSegments(path)) {
        if (current === null || current === undefined) {
            return undefined;
        }

        if (segment.startsWith("#")) {
            if (!Array.isArray(current)) {
                return undefined;
            }
            const id = segment.slice(1);
            current = current.find(
                item =>
                    item !== null &&
                    typeof item === "object" &&
                    (item as { _id?: string })._id === id
            );
            continue;
        }

        if (segment.startsWith("[")) {
            if (!Array.isArray(current)) {
                return undefined;
            }
            current = current[Number.parseInt(segment.slice(1, -1), 10)];
            continue;
        }

        if (typeof current !== "object") {
            return undefined;
        }

        current = (current as Record<string, unknown>)[segment];
    }

    return current;
};

export interface BuildBundleParams {
    changeset: { path: string; label: string }[];
    before: Record<string, unknown>;
    after: Record<string, unknown>;
}

/**
 * Before and after values for the changed paths.
 *
 * Deliberately unclever: full values, no truncation, no summarisation of its own. The ceiling is
 * enforced on the serialised result by the caller, and a bundle over the ceiling means no job at
 * all rather than a job working from values quietly trimmed underneath it — a model given half a
 * paragraph would describe half a change and read exactly as confidently.
 */
export const buildValueBundle = (params: BuildBundleParams): SummaryValueEntry[] => {
    return params.changeset.map(change => ({
        path: change.path,
        label: change.label,
        before: valueAtPath(params.before, change.path),
        after: valueAtPath(params.after, change.path)
    }));
};

/**
 * Serialised size of a bundle, measured before it is written.
 *
 * `JSON.stringify` can throw on a cyclic value, which nothing should produce but a custom field
 * type could. Treating that as infinitely large keeps it out of storage rather than taking the
 * write down with it.
 */
export const bundleByteSize = (bundle: SummaryValueEntry[]): number => {
    try {
        return Buffer.byteLength(JSON.stringify(bundle) ?? "", "utf8");
    } catch {
        return Number.POSITIVE_INFINITY;
    }
};

/**
 * Merges a later save's values into a run's bundle.
 *
 * The run's `before` is the earliest one seen, and its `after` is the latest, so the bundle always
 * spans from where the run started to where it has got to. A path touched twice keeps its original
 * before — which is the whole point, since a reader wants to know what the run did, not what its
 * last save did.
 */
export const extendValueBundle = (
    existing: SummaryValueEntry[],
    addition: SummaryValueEntry[]
): SummaryValueEntry[] => {
    const byPath = new Map(existing.map(entry => [entry.path, entry]));

    for (const entry of addition) {
        const found = byPath.get(entry.path);

        if (found) {
            byPath.set(entry.path, { ...found, after: entry.after });
            continue;
        }

        byPath.set(entry.path, entry);
    }

    return [...byPath.values()];
};

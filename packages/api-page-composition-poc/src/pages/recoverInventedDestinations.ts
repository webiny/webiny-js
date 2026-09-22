/** An invented destination, located on the page it was emptied from. */
export interface PlacedInvention {
    elementId: string;
    /** The input path within that element — `privacyPolicyLink/url`. */
    path: string;
    /** What the model wrote, before it was emptied. */
    value: string;
}

export interface RecoveredDestination {
    elementId: string;
    path: string;
    from: string;
    to: string;
}

export interface UnrecoveredDestination {
    elementId: string;
    path: string;
    value: string;
    reason: "no-match" | "ambiguous";
}

export interface RecoveryResult {
    bindings: Record<string, any>;
    recovered: RecoveredDestination[];
    unrecovered: UnrecoveredDestination[];
}

/** The last meaningful path segment, with any query or fragment removed first. */
const trailingSegment = (value: string): string => {
    const path = value.split("?")[0].split("#")[0];
    const segments = path.split("/").filter(Boolean);
    return (segments[segments.length - 1] ?? "").toLowerCase();
};

/**
 * Recover an invented destination when the page it was reaching for is one we migrated.
 *
 * The model shortens deep paths: it writes `/privacy-policy` where the site's page is
 * `/apartments/tx/houston/privacy-policy`. Twice in the five-site collection the shortened path
 * named a page that existed and had been migrated successfully, so emptying it lost a link whose
 * correct target was sitting in the same run.
 *
 * Exactly one match, or nothing. A trailing segment shared by two migrated pages is a guess between
 * them, and a wrong link is worse than an absent one — those are left empty and reported, not
 * resolved by picking the first.
 *
 * Runs AFTER rewriting on purpose. Writing a migrated path in before it would let the rewriting pass
 * count these as destinations it rewrote, and the whole reason this exists is that the rewritten
 * count was already being inflated by destinations the page never had.
 */
export const recoverInventedDestinations = (params: {
    bindings: Record<string, any>;
    invented: readonly PlacedInvention[];
    /** Paths of the pages actually created, as `toPageIdentity` derived them. */
    migratedPaths: ReadonlySet<string>;
}): RecoveryResult => {
    const { bindings, invented, migratedPaths } = params;

    // One index for the whole page: trailing segment -> the migrated paths that end in it.
    const bySegment = new Map<string, string[]>();
    for (const path of migratedPaths) {
        const segment = trailingSegment(path);
        if (!segment) {
            continue;
        }
        const existing = bySegment.get(segment) ?? [];
        existing.push(path);
        bySegment.set(segment, existing);
    }

    const next: Record<string, any> = { ...bindings };
    const recovered: RecoveredDestination[] = [];
    const unrecovered: UnrecoveredDestination[] = [];

    for (const invention of invented) {
        const segment = trailingSegment(invention.value);
        const matches = segment ? (bySegment.get(segment) ?? []) : [];

        if (matches.length !== 1) {
            unrecovered.push({
                elementId: invention.elementId,
                path: invention.path,
                value: invention.value,
                reason: matches.length === 0 ? "no-match" : "ambiguous"
            });
            continue;
        }

        const element = next[invention.elementId];
        const inputs = (element as { inputs?: Record<string, any> })?.inputs;
        if (!inputs || !(invention.path in inputs)) {
            // The input is gone — nothing to write back to, and inventing a binding would be worse.
            unrecovered.push({
                elementId: invention.elementId,
                path: invention.path,
                value: invention.value,
                reason: "no-match"
            });
            continue;
        }

        const target = matches[0];
        next[invention.elementId] = {
            ...(element as object),
            inputs: {
                ...inputs,
                [invention.path]: { ...inputs[invention.path], static: target }
            }
        };
        recovered.push({
            elementId: invention.elementId,
            path: invention.path,
            from: invention.value,
            to: target
        });
    }

    return { bindings: next, recovered, unrecovered };
};

export interface ComponentCopyStep {
    signature: string;
    /** The name the component carries now: stage 9's, suffix included. */
    name: string;
    /** The site component to update, or none to create one. */
    updateId: string | null;
}

/**
 * Which site component each approved component goes into.
 *
 * Stage 9 keeps both when a name is taken, so re-approving a component gives it a new name, `Name (2)`.
 * Matched by name, the site gained a second component on every re-approval and kept the first, unused,
 * shipped with every page and listed in the editor's palette: 6 bundles to 12 in one cycle on the
 * validation site. Matched by the cluster's signature, it updates the component it already holds for
 * that cluster, under the new name.
 *
 * Identity first, name second: a signature this site was built with before updates the component it
 * mapped to. Otherwise a component already holding the name is updated, as before the map existed.
 * Otherwise one is created. Two different clusters that share a name have different signatures, so
 * they never land on one component. Stage 9 is left as it is: updating there in place would swap the
 * code under every older root composition, whose inputs a regeneration renames.
 */
/** A name without stage 9's collision suffix: "Hero (3)" → "Hero". */
const baseName = (name: string): string => name.replace(/ \(\d+\)$/, "");
/** The suffix number, 1 for none: "Hero (3)" → 3, "Hero" → 1. */
const suffixOf = (name: string): number => Number(/ \((\d+)\)$/.exec(name)?.[1] ?? 1);

export const planComponentCopy = (params: {
    approved: Array<{ signature: string; name: string }>;
    /** The site tenant's components as they are now. */
    siteComponents: Array<{ id: string; name: string }>;
    /** Signature to site component id, from this site's earlier builds. */
    bySignature: Record<string, string>;
}): ComponentCopyStep[] => {
    const existingIds = new Set(params.siteComponents.map(component => component.id));
    const idByName = new Map(
        params.siteComponents.map(component => [component.name, component.id])
    );
    const claimed = new Set<string>();

    /*
     * A site built before the map existed has none, and its first build would add a full set of
     * leftovers. So with no map, an approved component whose base name is unique among the approved goes
     * into the site component with that base name and the highest suffix, the most recent copy. A base
     * name two approved components share (two clusters Classify named alike) is left to create. Every
     * build recomposes the whole site, so which record holds which code changes nothing a page renders;
     * this only decides reuse over creation.
     */
    const seeded = new Map<string, string>();
    if (Object.keys(params.bySignature).length === 0) {
        const approvedBases = new Map<string, number>();
        for (const { name } of params.approved) {
            approvedBases.set(baseName(name), (approvedBases.get(baseName(name)) ?? 0) + 1);
        }
        for (const { signature, name } of params.approved) {
            const base = baseName(name);
            if (approvedBases.get(base) !== 1) {
                continue;
            }
            const latest = params.siteComponents
                .filter(component => baseName(component.name) === base)
                .sort((a, b) => suffixOf(b.name) - suffixOf(a.name))[0];
            if (latest) {
                seeded.set(signature, latest.id);
            }
        }
    }

    return params.approved.map(({ signature, name }) => {
        const free = (id: string | undefined): id is string =>
            !!id && existingIds.has(id) && !claimed.has(id);
        const mapped = params.bySignature[signature] ?? seeded.get(signature);
        const byName = idByName.get(name);
        // A name can be held by one component only, so a component already holding the new name is the
        // one updated, even over the mapped one: renaming the mapped one onto it would give two
        // components one name.
        const updateId = free(byName) ? byName : free(mapped) ? mapped : null;
        if (updateId) {
            claimed.add(updateId);
        }
        return { signature, name, updateId };
    });
};

/**
 * Which of a site tenant's components a publish removes.
 *
 * A job that approves into its site tenant gets a new copy of a component on every re-approval
 * (stage 9 keeps both, so the live site's pages keep their components until it is published). Every
 * page of the site carries every component's bundle, so from the approval until the next publish live
 * pages carry both copies (+67% to +79% measured). Once published, the old copies are dead weight. A
 * copy is removed only when nothing could still render it:
 *
 * - it is not part of the approval being published;
 * - **no page in the tenant names it, whatever its state**: published, draft or unpublished. A draft
 *   counts: removing a draft's component breaks the draft with nothing to say so. That includes a page
 *   someone built by hand in the site's editor.
 *
 * The caller moves the pages this publish superseded to the bin first. Otherwise they would hold every
 * old copy forever.
 */
export const planComponentRemoval = (params: {
    /** Every page in the site tenant, any state, with its elements. */
    pages: Array<{ elements: Record<string, unknown> | null | undefined }>;
    components: Array<{ id: string; name: string }>;
    /** The components of the approval being published. */
    approvedIds: string[];
}): Array<{ id: string; name: string }> => {
    const approved = new Set(params.approvedIds);
    const named = new Set<string>();
    for (const page of params.pages) {
        for (const element of Object.values(page.elements ?? {})) {
            const name = (element as { component?: { name?: unknown } } | null)?.component?.name;
            if (typeof name === "string") {
                named.add(name);
            }
        }
    }
    return params.components.filter(
        component => !approved.has(component.id) && !named.has(component.name)
    );
};

/**
 * The subset of a CMS entry this needs. Deliberately structural rather than `CmsContentEntry`, so
 * the pure layer stays free of a CMS import and the function is trivial to test.
 */
export interface WrittenTarget {
    id?: string | null;
    savedOn?: string | null;
    revisionSavedOn?: string | null;
    revisionLastPublishedOn?: string | null;
    meta?: { status?: string | null } | null;
}

/**
 * An opaque string that changes whenever the target has been written.
 *
 * The timeline is fetched once per target and has no way of knowing that a save happened: capture
 * is server-side, and the entry form does not publish an after-save event a decorator can hook.
 * Comparing this signature across renders is the available signal, and it is a reliable one —
 * every entry mutation returns the saved entry and the form replaces its own copy with it.
 *
 * Each part covers an action the entry form can take that produces a record:
 *
 *   - `id` — a save against a locked revision creates a new revision, changing the revision id.
 *   - `revisionSavedOn` / `savedOn` — an ordinary save against the same revision.
 *   - `meta.status` — publish and unpublish.
 *   - `revisionLastPublishedOn` — republishing, where the status is already `published` and does
 *     not move.
 *
 * Returns an empty string for no entry, so an unsaved form has a stable signature rather than one
 * that flickers between undefined and a value.
 */
export const writeSignature = (target: WrittenTarget | null | undefined): string => {
    if (!target) {
        return "";
    }

    return [
        target.id ?? "",
        target.savedOn ?? "",
        target.revisionSavedOn ?? "",
        target.revisionLastPublishedOn ?? "",
        target.meta?.status ?? ""
    ].join("|");
};

/** The part of a revision group this decision needs. */
export interface DisclosableRevision {
    revision: string;
    isCurrent: boolean;
}

/**
 * Which revisions are open before the reader has touched anything.
 *
 * An entry with a long history is mostly history the reader did not come for: they opened the
 * panel on a particular revision, and the saves under it are the ones the question is about.
 * Everything else stays shut, named and counted, one click away.
 *
 * Two exceptions, both the same rule — never show a panel that is nothing but headers:
 *
 * A filtered timeline opens everything. Filtering is already a narrowing, and collapsing on top
 * of it would hide the result: ask for one person's changes and you would get a column of closed
 * revisions with no way to see that any of them matched.
 *
 * With no current revision among the groups, the newest opens instead. `isCurrent` comes from the
 * entry form, so it is absent while the form is still loading, and it can miss entirely for a
 * revision that has activity but no longer exists.
 */
export const defaultOpenRevisions = (
    groups: DisclosableRevision[],
    filtersActive: boolean
): Set<string> => {
    if (filtersActive) {
        return new Set(groups.map(group => group.revision));
    }

    const current = groups.filter(group => group.isCurrent);

    if (current.length > 0) {
        return new Set(current.map(group => group.revision));
    }

    return new Set(groups.slice(0, 1).map(group => group.revision));
};

/**
 * Whether one revision is open, given what the reader has chosen.
 *
 * `overrides` holds only revisions the reader has actually clicked. Anything absent falls back to
 * the default, which is what lets a revision arriving on a refresh open or close correctly instead
 * of inheriting a neighbour's state.
 */
export const isRevisionOpen = (
    revision: string,
    overrides: Record<string, boolean>,
    defaults: Set<string>
): boolean => overrides[revision] ?? defaults.has(revision);

/**
 * What to tell a reader whose filters matched nothing.
 *
 * The design's line is the first one, and it is the right line while the filter bar is open: the
 * two dropdowns are on screen, and setting either back to All is the shortest way out.
 *
 * It is the wrong line when the bar is shut, because it names two controls the reader cannot see.
 * The second line is not from the design — the design did not consider a shut bar — and it points
 * at the one control that is always there, which carries a count for exactly this reason.
 *
 * No action button either way. The redesign replaced the global clear with a cross on each
 * dropdown, and an empty state offering a button the rest of the panel no longer has is the
 * previous design surviving in the one place nobody looks.
 */
export const emptyFilteredHint = (filterBarOpen: boolean): string =>
    filterBarOpen
        ? "Set either dropdown back to All to widen the timeline."
        : "Open the filter bar and set either dropdown back to All to widen the timeline.";

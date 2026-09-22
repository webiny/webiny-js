import { describePath, humaniseFieldId, splitPathSegments } from "~/shared/index.js";
import type { TimelineChange } from "./types.js";

export { humaniseFieldId };

export interface DescribedChange {
    /** The changed field's own name, as captured when the change was recorded. */
    label: string;
    /**
     * Containing fields, outermost first, humanised from the path.
     *
     * These come from field *ids*, not captured labels — the record stores only the leaf's label.
     * So an ancestor renamed since the change will read by its old id here while the leaf reads by
     * its captured label. Imperfect, and better than showing a reader `sections#a1b2c3.blocks[2]`.
     */
    ancestors: string[];
    /**
     * One-based position, when the change was inside a positional list item.
     *
     * Absent for id-keyed items: a stable id says *which* block changed, but not where it sits,
     * and its position may since have moved. Inventing a position from an id would be a guess a
     * reader would reasonably act on.
     */
    position?: number;
    operation?: string | null;
    /** Ancestors and label joined for display, e.g. `Sections › Blocks › Title`. */
    text: string;
}

/**
 * Turns one changeset entry into something a person can read.
 *
 * The path derivation is shared with the API side through `~/shared`, so the timeline and the
 * summary prompt name a field the same way. Two implementations would drift, and
 * the drift would surface as one change described two ways on a single screen.
 *
 * The rolled-up entry past the changeset cap is a real case: its path points at a parent rather
 * than a field, and it has no leaf of its own. It reads as the parent's own name, with the caller
 * left to say how many changes it stands for.
 */
export const describeChange = (change: TimelineChange): DescribedChange => {
    const { ancestors, position } = describePath(change.path);

    const label =
        change.label.trim() === ""
            ? humaniseFieldId(splitPathSegments(change.path).at(-1) ?? "")
            : change.label;

    return {
        label,
        ancestors,
        ...(position === undefined ? {} : { position }),
        operation: change.operation ?? null,
        text: [...ancestors, label].join(" › ")
    };
};

/** The whole changeset, described. */
export const describeChangeset = (changeset: TimelineChange[]): DescribedChange[] => {
    return changeset.map(describeChange);
};

/**
 * A containing path as one line, with its middle elided when it is deep.
 *
 * Four levels of nesting is ordinary in this data — a variant inside a product, a price inside a
 * region inside that variant — and the full crumb trail is both long and mostly uninformative: the
 * reader needs to know where the change was, and the outermost and innermost names carry nearly all
 * of that. The whole path stays available on hover, and the depth is stated separately so the
 * elision never hides how far down the change actually was.
 */
export const elideAncestors = (ancestors: string[]): string => {
    if (ancestors.length <= 2) {
        return ancestors.join(" › ");
    }

    return `${ancestors[0]} › … › ${ancestors[ancestors.length - 1]}`;
};

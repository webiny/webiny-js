/**
 * Turning a changeset path into words.
 *
 * Shared because both halves of the feature have to name a field the same way and there is no
 * acceptable direction for one to import the other: the timeline derives its deterministic
 * description from a path, and the summary job puts field names in a prompt so a model describes
 * "the pricing heading" rather than a path expression. Two implementations would drift, and the
 * drift would show up as the same change described two different ways on one screen.
 *
 * Deliberately pure and dependency-free. It knows nothing about the CMS, about records, or about
 * React.
 */

/**
 * Splits an encoded path into its raw segments.
 *
 * A path is field ids joined by `.`, with `#<id>` for an identified list item and `[n]` for a
 * positional one — the inverse of how the differ encodes them.
 */
export const splitPathSegments = (path: string): string[] => {
    return (
        path.match(/(?:^|\.)[a-zA-Z0-9]+|#[a-z0-9]+|\[\d+\]/g)?.map(s => s.replace(/^\./, "")) ?? []
    );
};

/**
 * Humanises a field id: `heroHeadline` becomes `Hero headline`.
 *
 * Deliberately conservative — it splits camel case and capitalises the first word, and does
 * nothing clever. A field id is not a label, and dressing it up further would imply a fidelity
 * that is not there.
 */
export const humaniseFieldId = (fieldId: string): string => {
    const spaced = fieldId
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .trim()
        .toLowerCase();

    if (spaced === "") {
        return fieldId;
    }

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export interface DescribedPath {
    /**
     * Containing fields, outermost first, humanised from the path.
     *
     * These come from field *ids*, not captured labels — a record stores only the leaf's label. So
     * an ancestor renamed since the change reads by its old id here while the leaf reads by its
     * captured label. Imperfect, and better than showing `sections#a1b2c3.blocks[2].title`.
     */
    ancestors: string[];
    /**
     * One-based position, when the change was inside a positional list item.
     *
     * Absent for id-keyed items: a stable id says *which* block changed, but not where it sits, and
     * its position may since have moved. Inventing a position from an id would be a guess a reader
     * would reasonably act on.
     */
    position?: number;
    /** True when the path ends at a list item rather than at a field inside one. */
    endsAtListItem: boolean;
}

/**
 * The containing structure a path names, without the leaf.
 *
 * The leaf is described by its captured label, which the caller holds, so it is dropped here —
 * unless the path ends at a list item, identified or positional, in which case the last field *is*
 * the container the item belongs to and stays.
 */
export const describePath = (path: string): DescribedPath => {
    const fields: string[] = [];
    let position: number | undefined;
    let endsAtListItem = false;

    for (const segment of splitPathSegments(path)) {
        if (segment.startsWith("#")) {
            endsAtListItem = true;
            continue;
        }

        if (segment.startsWith("[")) {
            // Only the innermost position is surfaced; a reader does not need the full coordinate.
            position = Number.parseInt(segment.slice(1, -1), 10) + 1;
            endsAtListItem = true;
            continue;
        }

        fields.push(segment);
        endsAtListItem = false;
    }

    const ancestors = (endsAtListItem ? fields : fields.slice(0, -1)).map(humaniseFieldId);

    return {
        ancestors,
        ...(position === undefined ? {} : { position }),
        endsAtListItem
    };
};

/**
 * A path and its leaf label as one readable phrase: `Page body › Testimonials › Heading`.
 *
 * Used wherever a field has to be named in running text — a prompt, a log line — as opposed to
 * rendered as separate crumbs.
 */
export const readablePath = (path: string, label: string): string => {
    const { ancestors } = describePath(path);
    const leaf =
        label.trim() === "" ? humaniseFieldId(splitPathSegments(path).at(-1) ?? path) : label;

    return [...ancestors, leaf].join(" › ");
};

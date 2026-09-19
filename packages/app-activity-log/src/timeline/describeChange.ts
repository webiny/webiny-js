import type { TimelineChange } from "./types.js";

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

const SEGMENT = /(?:^|\.)([a-zA-Z0-9]+)|#([a-z0-9]+)|\[(\d+)\]/g;

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

/**
 * Turns one changeset entry into something a person can read.
 *
 * The path is the machine-readable part — `sections#a1b2c3d4e5f6.blocks[2].title` is precise and
 * unreadable. This splits it into containing fields and a position, and pairs them with the
 * captured leaf label.
 *
 * The rolled-up entry past the changeset cap is a real case: its path points at a parent rather
 * than a field, and it has no leaf of its own. It reads as the parent's own name, with the caller
 * left to say how many changes it stands for.
 */
export const describeChange = (change: TimelineChange): DescribedChange => {
    const fields: string[] = [];
    let position: number | undefined;
    let lastWasListItem = false;

    for (const match of change.path.matchAll(SEGMENT)) {
        const [, fieldId, itemId, index] = match;

        if (fieldId !== undefined) {
            fields.push(fieldId);
            lastWasListItem = false;
            continue;
        }

        if (itemId !== undefined) {
            // An identified block. It says *which* item, so no position is derived — but it does
            // mean the preceding field is the container rather than the changed thing.
            lastWasListItem = true;
            continue;
        }

        if (index !== undefined) {
            // Only the innermost position is surfaced; a reader does not need the full coordinate.
            position = Number.parseInt(index, 10) + 1;
            lastWasListItem = true;
        }
    }

    // The leaf's own segment is described by the captured label, so it is dropped from the
    // ancestor list — unless the path ends at a list item, identified or positional, in which case
    // the last field *is* the container the item belongs to and stays.
    const ancestors = (lastWasListItem ? fields : fields.slice(0, -1)).map(humaniseFieldId);

    const label = change.label.trim() === "" ? humaniseFieldId(fields.at(-1) ?? "") : change.label;

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

import type { ChangesetEntry } from "~/core/types.js";
import { commonParentPath, splitPathSegments } from "~/core/paths.js";
import { labelForPath, type FieldDescriptor } from "./descriptors.js";

/**
 * Entries beyond this many are collapsed to their nearest common parent.
 *
 * A cap is needed because a bulk field rename, a template swap or a first save after an upgrade
 * can touch every field of a large entry, and a record that lists them all is both expensive to
 * store and useless to read.
 */
export const DEFAULT_MAX_ENTRIES = 100;

export interface RollUpResult {
    changeset: ChangesetEntry[];
    truncated: boolean;
}

/**
 * Keeps the first `maxEntries` changes and replaces the remainder with a single entry at their
 * nearest common ancestor.
 *
 * Collapsing to a common parent rather than simply dropping the tail is what keeps the record
 * honest: the reader is told that more changed and where, instead of being shown a truncated list
 * that looks complete. When the overflow shares no ancestor the parent is the target root, whose
 * label is empty — which reads as "elsewhere in this entry".
 */
export const rollUp = (
    entries: ChangesetEntry[],
    fields: FieldDescriptor[],
    maxEntries: number = DEFAULT_MAX_ENTRIES
): RollUpResult => {
    if (entries.length <= maxEntries) {
        return { changeset: entries, truncated: false };
    }

    const kept = entries.slice(0, maxEntries);
    const overflow = entries.slice(maxEntries);
    const parent = commonParentPath(overflow.map(entry => entry.path));

    kept.push({
        path: parent,
        label: labelForPath(fields, splitPathSegments(parent))
    });

    return { changeset: kept, truncated: true };
};

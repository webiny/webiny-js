import type { WorkflowExclusion } from "~/settings/domain/types.js";

/*
 * The list with `entry` in it (R318): it replaces the entry of the same user in place, else it is
 * appended. Every other entry stays the same object in the same order; the given list is not
 * changed.
 */
export const upsertExclusion = (
    list: WorkflowExclusion[],
    entry: WorkflowExclusion
): WorkflowExclusion[] => {
    const index = list.findIndex(exclusion => exclusion.userId === entry.userId);
    if (index === -1) {
        return [...list, entry];
    }
    const next = [...list];
    next[index] = entry;
    return next;
};

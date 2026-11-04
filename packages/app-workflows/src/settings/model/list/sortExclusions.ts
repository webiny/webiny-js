import type { WorkflowExclusion } from "~/settings/domain/types.js";

const compareIds = (first: string, second: string): number => {
    if (first < second) {
        return -1;
    }
    if (first > second) {
        return 1;
    }
    return 0;
};

/*
 * The rows sorted by their name label (R322, Q66): case-insensitive, `sensitivity: "base"`; a user
 * with no label in `labels` sorts by the raw id. `Deleted user` is a label like any other; equal
 * labels sort by user id. A new list.
 */
export const sortExclusions = (
    list: WorkflowExclusion[],
    labels: ReadonlyMap<string, string>
): WorkflowExclusion[] => {
    const sorted = [...list];

    sorted.sort((first, second) => {
        const firstLabel = labels.get(first.userId) ?? first.userId;
        const secondLabel = labels.get(second.userId) ?? second.userId;
        const byLabel = firstLabel.localeCompare(secondLabel, undefined, { sensitivity: "base" });
        if (byLabel !== 0) {
            return byLabel;
        }
        return compareIds(first.userId, second.userId);
    });

    return sorted;
};

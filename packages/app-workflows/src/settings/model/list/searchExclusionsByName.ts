import type { WorkflowExclusion } from "~/settings/domain/types.js";

// The rows whose user's display name contains the search, ignoring case; a blank search keeps every row.
export const searchExclusionsByName = (
    list: WorkflowExclusion[],
    labels: Map<string, string>,
    search: string
): WorkflowExclusion[] => {
    const needle = search.trim().toLowerCase();
    if (needle === "") {
        return list;
    }
    return list.filter(exclusion => {
        const label = labels.get(exclusion.userId) ?? "";
        return label.toLowerCase().includes(needle);
    });
};

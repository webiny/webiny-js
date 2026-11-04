import type { WorkflowExclusion } from "~/settings/domain/types.js";

// The list without the user's entry (R318); every other entry stays the same object in the same order.
export const removeExclusion = (list: WorkflowExclusion[], userId: string): WorkflowExclusion[] => {
    return list.filter(exclusion => exclusion.userId !== userId);
};

import type { WorkflowExclusion } from "~/settings/domain/types.js";

// An exclusion of `user-1` with no reason and no end date; `overrides` win.
export const createExclusion = (overrides: Partial<WorkflowExclusion> = {}): WorkflowExclusion => {
    return {
        userId: "user-1",
        reason: null,
        endsOn: null,
        ...overrides
    };
};

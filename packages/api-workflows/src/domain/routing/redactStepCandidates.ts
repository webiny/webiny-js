import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import type { StepCandidate } from "./types.js";

/**
 * The step candidates one viewer may see (D89, D97, R120). Pure. `editor` and `reassign` (full
 * access sets both) see why a person is excluded; everyone else sees only that they are, because an
 * exclusion's reason is personal. Order is kept.
 */
export const redactStepCandidates = (
    candidates: StepCandidate[],
    permissions: WorkflowsPermissionSet
): StepCandidate[] => {
    if (permissions.editor || permissions.reassign) {
        return candidates.map(candidate => ({ ...candidate }));
    }
    return candidates.map(candidate => ({ ...candidate, excludedReason: null }));
};

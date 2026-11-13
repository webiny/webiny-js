import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import type { WorkflowStateFilter } from "../ListWorkflowStates/WorkflowStateFilter.js";

interface IFilterReadableStatesParams {
    identityContext: IdentityContext.Interface;
    stateFilter: WorkflowStateFilter.Interface;
    items: WorkflowState[];
}

/**
 * A workflow state is readable by members of a team assigned to one of its steps (reviewers),
 * and otherwise only by those the app's `WorkflowStateFilter` allows (read access to the target).
 * Background work (tasks, scheduler) runs without authorization and reads everything.
 */
export const filterReadableStates = async (
    params: IFilterReadableStatesParams
): Promise<WorkflowState[]> => {
    const { identityContext, stateFilter, items } = params;
    if (!identityContext.isAuthorizationEnabled()) {
        return items;
    }

    const reviewable = items.filter(item => item.steps.some(step => step.canReview));
    const others = items.filter(item => !reviewable.includes(item));

    const allowed = new Set<WorkflowState>(reviewable);
    if (others.length > 0) {
        for (const item of await stateFilter.filter(others)) {
            allowed.add(item);
        }
    }

    return items.filter(item => allowed.has(item));
};

import type { WorkflowExclusion } from "~/domain/settings/types.js";
import { ROUTING_SKIP_REASONS, type RoutingSkipReason } from "./reasons.js";

export interface RoutingUserEligibilityParams {
    userId: string;
    requesterId: string;
    /** Members of the candidate teams. */
    memberIds: string[];
    /** Active exclusions only (`filterActiveExclusions`). */
    exclusions: WorkflowExclusion[];
}

/**
 * Why a person target cannot get the step, before the read check (R112): the requester, then
 * membership, then exclusion. The requester comes first, so a requester outside the step's teams
 * gets the requester reason. `null` when they pass; the caller checks read access next. Pure.
 */
export const getRoutingUserSkipReason = (
    params: RoutingUserEligibilityParams
): RoutingSkipReason | null => {
    if (params.userId === params.requesterId) {
        return ROUTING_SKIP_REASONS.requester;
    }
    if (!params.memberIds.includes(params.userId)) {
        return ROUTING_SKIP_REASONS.notMember;
    }
    if (params.exclusions.some(exclusion => exclusion.userId === params.userId)) {
        return ROUTING_SKIP_REASONS.excluded;
    }
    return null;
};

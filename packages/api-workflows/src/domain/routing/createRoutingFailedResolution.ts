import type { StepAssignmentResolution } from "~/domain/review/types.js";
import { ROUTING_FAILED_REASON } from "./reasons.js";

/**
 * The pool of the step's teams after a routing failure (spec 6, R116): the step still reaches,
 * and the log says why nobody was chosen. Pure.
 */
export const createRoutingFailedResolution = (teamIds: string[]): StepAssignmentResolution => {
    return {
        owner: null,
        candidateTeamIds: [...teamIds],
        assignment: { source: "pool", reason: ROUTING_FAILED_REASON },
        records: [
            {
                kind: "outcome",
                userId: null,
                source: "pool",
                ruleId: null,
                by: null,
                reason: ROUTING_FAILED_REASON
            }
        ]
    };
};

import type { StepAssignmentResolution } from "~/domain/review/types.js";
import type { RoutingDecidedSoFar } from "./errors.js";
import { ROUTING_FAILED_REASON } from "./reasons.js";

/**
 * The pool after a routing failure (spec 6, R116 refined): the step still reaches, keeping what
 * was decided before the failure (the candidate teams, a team-target rule and the skips gathered),
 * and the log says why nobody was chosen. Pure.
 */
export const createRoutingFailedResolution = (
    decided: RoutingDecidedSoFar
): StepAssignmentResolution => {
    return {
        owner: null,
        candidateTeamIds: [...decided.candidateTeamIds],
        assignment: {
            source: "pool",
            ...(decided.ruleId ? { ruleId: decided.ruleId } : {}),
            reason: ROUTING_FAILED_REASON
        },
        records: [
            ...decided.skips.map(skip => ({ ...skip })),
            {
                kind: "outcome",
                userId: null,
                source: "pool",
                ruleId: decided.ruleId,
                by: null,
                reason: ROUTING_FAILED_REASON
            }
        ]
    };
};

import type { StepAssignmentResolution } from "~/domain/review/types.js";
import type { RoutingEvaluation } from "./types.js";

/**
 * The resolution for `Review.reach` (spec 5.2, 6): the owner as an admin user actor, the
 * assignment with the deciding rule and the pool reason when set, and the records (R117). Pure.
 */
export const toStepAssignmentResolution = (
    evaluation: RoutingEvaluation
): StepAssignmentResolution => {
    return {
        owner: evaluation.owner
            ? {
                  type: "user",
                  id: evaluation.owner.id,
                  displayName: evaluation.owner.displayName,
                  identityType: "admin"
              }
            : null,
        candidateTeamIds: [...evaluation.candidateTeamIds],
        assignment: {
            source: evaluation.source,
            ...(evaluation.ruleId ? { ruleId: evaluation.ruleId } : {}),
            ...(evaluation.reason ? { reason: evaluation.reason } : {})
        },
        records: structuredClone(evaluation.records)
    };
};

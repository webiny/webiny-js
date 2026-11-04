import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewStep } from "~/domain/review/types.js";
import type { RoutingMembersParams } from "./types.js";

export interface StepMembersParamsInput {
    review: ReviewData;
    /** The review's step whose members are listed. */
    step: ReviewStep;
    /** Exclusion expiry is evaluated at this instant. */
    now: Date;
}

/**
 * The `listMembers` params for a review's step (R120): the teams the step was reached with, the
 * review's requester excluded, read access checked on the reviewed revision. Pure.
 */
export const toStepMembersParams = (input: StepMembersParamsInput): RoutingMembersParams => {
    const { review, step, now } = input;
    return {
        teamIds: [...step.candidateTeamIds],
        requesterId: review.createdBy.id,
        model: review.model,
        read: {
            type: "target",
            targetId: review.targetId,
            targetRevisionId: review.targetRevisionId
        },
        now
    };
};

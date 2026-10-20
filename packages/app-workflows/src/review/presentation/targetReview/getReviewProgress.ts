import type { Review } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import type { TargetReviewProgressVm } from "./abstractions.js";
import type { TargetReviewSegmentVm } from "./abstractions.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getStepRunMessage } from "./getStepRunMessage.js";
import { getStepStateTag } from "./getStepStateTag.js";
import { getStepTagTooltip } from "./getStepTagTooltip.js";
import { isStepRunning } from "./isStepRunning.js";

// "n of N steps approved" and the segments of the popover (README 6, R263).
export const getReviewProgress = (review: Review): TargetReviewProgressVm => {
    const segments: TargetReviewSegmentVm[] = review.steps.map(step => {
        return {
            stepId: step.id,
            title: step.title,
            state: step.state,
            ownerLabel: getStepOwnerLabel(step),
            comment: step.comment,
            tag: getStepStateTag(step.state, isStepRunning(step)),
            message: getStepRunMessage(step),
            tooltip: getStepTagTooltip(step)
        };
    });
    const approved = review.steps.filter(step => step.state === StepState.Approved).length;

    return { approved, total: review.steps.length, segments };
};

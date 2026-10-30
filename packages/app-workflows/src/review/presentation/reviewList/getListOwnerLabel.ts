import type { ReviewActor } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";

/*
 * A person is named; an AI or automation owner shows the step title, never the model or
 * automation behind it (QBZ-79). A step waiting in its team pool has no owner and reads
 * "Team pool" (README 8).
 */
export const getListOwnerLabel = (
    owner: ReviewActor | null,
    stepTitle: string | null,
    stepState: StepStateValue | null
): string | null => {
    if (!owner) {
        if (stepState === StepState.Awaiting) {
            return "Team pool";
        }
        return null;
    }
    if (owner.type === "user") {
        return owner.displayName;
    }
    return stepTitle ?? owner.displayName;
};

import type { StepCandidate } from "~/review/domain/types.js";
import type { ReviewerPickerOptionVm } from "./abstractions.js";

/*
 * The picker options (R209, R230): the current owner "Current owner", excluded people
 * "Unavailable[: reason]" (the reason only when the server sent it, D97), both disabled. Pure.
 */
export const getPickerOptions = (
    candidates: StepCandidate[],
    currentOwnerId: string | null
): ReviewerPickerOptionVm[] => {
    return candidates.map(candidate => {
        if (candidate.id === currentOwnerId) {
            return {
                label: `${candidate.displayName} (Current owner)`,
                value: candidate.id,
                disabled: true
            };
        }
        if (candidate.excluded) {
            let suffix = "Unavailable";
            if (candidate.excludedReason) {
                suffix = `Unavailable: ${candidate.excludedReason}`;
            }
            return {
                label: `${candidate.displayName} (${suffix})`,
                value: candidate.id,
                disabled: true
            };
        }
        return { label: candidate.displayName, value: candidate.id, disabled: false };
    });
};

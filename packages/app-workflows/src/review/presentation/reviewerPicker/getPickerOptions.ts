import type { StepCandidate } from "~/review/domain/types.js";
import type { ReviewerPickerOptionVm } from "./abstractions.js";
import { getInitials } from "./getInitials.js";

/*
 * The picker options (R209, R230): the current owner noted "Current owner", excluded people noted
 * "Unavailable[: reason]" (the reason only when the server sent it, D97), both disabled. Pure.
 */
export const getPickerOptions = (
    candidates: StepCandidate[],
    currentOwnerId: string | null
): ReviewerPickerOptionVm[] => {
    return candidates.map(candidate => {
        let note: string | null = null;
        if (candidate.id === currentOwnerId) {
            note = "Current owner";
        } else if (candidate.excluded) {
            note = "Unavailable";
            if (candidate.excludedReason) {
                note = `Unavailable: ${candidate.excludedReason}`;
            }
        }
        return {
            label: candidate.displayName,
            value: candidate.id,
            disabled: note !== null,
            initials: getInitials(candidate.displayName),
            teams: candidate.teamNames.join(", "),
            note
        };
    });
};

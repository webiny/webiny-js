import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import { STEP_FORM_MESSAGES } from "./stepFormMessages.js";

// A team as a picker option; a team with no members carries the chip warning (R282).
export const toTeamPickerOption = (team: WorkflowTeamSummary): PickerOption => {
    let warning: string | null = null;
    if (team.memberCount === 0) {
        warning = STEP_FORM_MESSAGES.teamHasNoMembers;
    }
    return {
        id: team.id,
        label: team.name,
        description: null,
        warning,
        muted: false,
        disabled: false,
        icon: "group"
    };
};

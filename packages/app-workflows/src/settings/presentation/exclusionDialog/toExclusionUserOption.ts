import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";

const IN_THE_LIST = "Already excluded";

/*
 * A user search result of the Add dialog (R324, Q64): a user who already has an entry, active or
 * expired, is listed disabled with the note `Already excluded`.
 */
export const toExclusionUserOption = (user: WorkflowUserSummary, inList: boolean): PickerOption => {
    let note: string | null = null;
    if (inList) {
        note = IN_THE_LIST;
    }
    return {
        id: user.id,
        label: user.displayName,
        description: user.teams.length > 0 ? user.teams.map(team => team.name).join(", ") : null,
        warning: null,
        muted: false,
        disabled: inList,
        icon: null,
        note
    };
};

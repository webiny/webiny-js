import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";

const NO_TEAM_NAMES: ReadonlyMap<string, string> = new Map();

/*
 * A user as a picker option (R307): the display name, the `person` icon and, when the names of the
 * user's teams are known, the sub line `Team A, Team B`. The sub line lists only the teams whose
 * name is in `teamNames`, in the order of the user's team ids.
 */
export const toUserPickerOption = (
    user: WorkflowUserSummary,
    teamNames: ReadonlyMap<string, string> = NO_TEAM_NAMES
): PickerOption => {
    const names: string[] = [];
    for (const teamId of user.teamIds) {
        const name = teamNames.get(teamId);
        if (name !== undefined) {
            names.push(name);
        }
    }

    let description: string | null = null;
    if (names.length > 0) {
        description = names.join(", ");
    }

    return {
        id: user.id,
        label: user.displayName,
        description,
        warning: null,
        muted: false,
        disabled: false,
        icon: "person"
    };
};

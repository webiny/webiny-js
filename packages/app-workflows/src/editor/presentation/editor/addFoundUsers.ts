import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { getReferenceLabel } from "~/editor/model/rules/getReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

// Found users (from a lookup or a search) join the maps with their team ids; a new object is returned.
export const addFoundUsers = (
    references: RuleReferences,
    users: WorkflowUserSummary[]
): RuleReferences => {
    if (users.length === 0) {
        return references;
    }
    const labels = new Map(references.users);
    const userTeamIds = new Map(references.userTeamIds);
    for (const user of users) {
        const label = getReferenceLabel({
            kind: "user",
            id: user.id,
            name: user.displayName,
            state: "found"
        });
        labels.set(user.id, label);
        userTeamIds.set(user.id, user.teamIds);
    }
    return { ...references, users: labels, userTeamIds };
};

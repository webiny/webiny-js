import type { ReferenceLabel } from "~/editor/model/rules/ReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { RuleReferenceIds } from "./RuleReferenceIds.js";

function keepWanted(
    source: ReadonlyMap<string, ReferenceLabel>,
    ids: string[]
): Map<string, ReferenceLabel> {
    const kept = new Map<string, ReferenceLabel>();
    for (const id of ids) {
        const label = source.get(id);
        if (label !== undefined) {
            kept.set(id, label);
        }
    }
    return kept;
}

// Drops every entry no rule references any more (after a save the maps are rebuilt from the saved ids).
export const pruneRuleReferences = (
    references: RuleReferences,
    wanted: RuleReferenceIds
): RuleReferences => {
    const users = keepWanted(references.users, wanted.userIds);
    const teams = keepWanted(references.teams, wanted.teamIds);
    const folders = keepWanted(
        references.folders,
        wanted.folders.map(folder => folder.id)
    );
    const userTeamIds = new Map<string, string[]>();
    for (const id of users.keys()) {
        const teamIds = references.userTeamIds.get(id);
        if (teamIds !== undefined) {
            userTeamIds.set(id, teamIds);
        }
    }
    return { users, teams, folders, userTeamIds };
};

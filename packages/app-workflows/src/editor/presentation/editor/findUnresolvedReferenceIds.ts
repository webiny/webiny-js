import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { RuleReferenceIds } from "./RuleReferenceIds.js";

// The wanted ids no map holds yet: resolved ids (found, deleted or restricted) are never asked again.
export const findUnresolvedReferenceIds = (
    wanted: RuleReferenceIds,
    references: RuleReferences
): RuleReferenceIds => {
    return {
        userIds: wanted.userIds.filter(id => !references.users.has(id)),
        teamIds: wanted.teamIds.filter(id => !references.teams.has(id)),
        folders: wanted.folders.filter(folder => !references.folders.has(folder.id))
    };
};

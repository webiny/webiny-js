import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";
import type { RuleReferences } from "./RuleReferences.js";

/*
 * Whether a rule's resolved target is outside the reviewing teams (R299, R307): a found user whose
 * known teams hold none of `stepTeamIds`, or a found team that is not one of them. A deleted or
 * unresolved target, and a user whose teams are unknown, is not. Pure.
 */
export const isTargetOutsideTeams = (
    target: RuleTargetValue,
    stepTeamIds: string[],
    references: RuleReferences
): boolean => {
    if (target.type === "user") {
        const reference = references.users.get(target.id);
        if (reference === undefined || reference.state !== "found") {
            return false;
        }
        const teamIds = references.userTeamIds.get(target.id);
        if (teamIds === undefined) {
            return false;
        }
        return !teamIds.some(id => stepTeamIds.includes(id));
    }
    const reference = references.teams.get(target.id);
    if (reference === undefined || reference.state !== "found") {
        return false;
    }
    return !stepTeamIds.includes(target.id);
};

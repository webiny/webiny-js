import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

export interface InspectionLookupIds {
    userIds: string[];
    teamIds: string[];
}

function addUnique(list: string[], id: string): void {
    if (!list.includes(id)) {
        list.push(id);
    }
}

/*
 * The ids of an inspection whose names the editor does not know yet (R301): the candidates, the
 * skipped people the server left unnamed (Copy gap 4) and the narrowed team. An id the maps hold in
 * any state is known: found gives a name, deleted or restricted is known to have none. The owner
 * carries its own name. Pure.
 */
export const collectInspectionLookupIds = (
    inspection: RoutingInspection,
    references: RuleReferences
): InspectionLookupIds => {
    const userIds: string[] = [];
    const teamIds: string[] = [];

    for (const id of inspection.candidateIds) {
        if (!references.users.has(id)) {
            addUnique(userIds, id);
        }
    }
    for (const person of inspection.skipped) {
        if (person.displayName === null && !references.users.has(person.userId)) {
            addUnique(userIds, person.userId);
        }
    }

    const narrowed = inspection.narrowedTeamId;
    if (narrowed !== null && !references.teams.has(narrowed)) {
        addUnique(teamIds, narrowed);
    }

    return { userIds, teamIds };
};

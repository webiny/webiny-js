import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import { getReferenceLabel } from "~/editor/model/rules/getReferenceLabel.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

// Found teams (from a lookup, a search or the step teams) join the maps; a new object is returned.
export const addFoundTeams = (
    references: RuleReferences,
    teams: WorkflowTeamSummary[]
): RuleReferences => {
    if (teams.length === 0) {
        return references;
    }
    const labels = new Map(references.teams);
    for (const team of teams) {
        const label = getReferenceLabel({
            kind: "team",
            id: team.id,
            name: team.name,
            state: "found"
        });
        labels.set(team.id, label);
    }
    return { ...references, teams: labels };
};

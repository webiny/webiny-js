import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { InspectionNames } from "~/editor/model/testRouting/TestRoutingContext.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";

export interface BuildInspectionNamesParams {
    references: RuleReferences;
    // The users and teams the lookups found.
    users: WorkflowUserSummary[];
    teams: WorkflowTeamSummary[];
}

/*
 * The names Test routing composes with (R301): the found references first, then the looked-up users
 * and teams. A deleted or restricted reference has no name and is left out. Pure.
 */
export const buildInspectionNames = (params: BuildInspectionNamesParams): InspectionNames => {
    const users = new Map<string, string>();
    for (const label of params.references.users.values()) {
        if (label.state === "found") {
            users.set(label.id, label.label);
        }
    }
    for (const user of params.users) {
        users.set(user.id, user.displayName);
    }

    const teams = new Map<string, string>();
    for (const label of params.references.teams.values()) {
        if (label.state === "found") {
            teams.set(label.id, label.label);
        }
    }
    for (const team of params.teams) {
        teams.set(team.id, team.name);
    }

    return { users, teams };
};

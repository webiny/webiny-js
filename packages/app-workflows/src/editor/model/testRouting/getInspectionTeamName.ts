import type { TestRoutingContext } from "./TestRoutingContext.js";

const DELETED_TEAM = "Deleted team";

// A team's name for the Test routing prose: the looked-up name, then the reference label, then `Deleted team`.
export const getInspectionTeamName = (teamId: string, context: TestRoutingContext): string => {
    const looked = context.names.teams.get(teamId);
    if (looked !== undefined) {
        return looked;
    }
    const reference = context.references.teams.get(teamId);
    if (reference !== undefined) {
        return reference.label;
    }
    return DELETED_TEAM;
};

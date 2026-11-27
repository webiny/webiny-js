import { joinTeamNames } from "./joinTeamNames.js";

/*
 * The note of a step nobody but the requester can review: it names the step's teams when the
 * workflow lists them. Pure.
 */
export const getNobodyEligibleNote = (teamNames: string[]): string => {
    const teams = joinTeamNames(teamNames);
    const where = teams === "" ? "" : ` in ${teams}`;
    return `Nobody${where} other than you can review this step. Ask a workflow manager to add reviewers.`;
};

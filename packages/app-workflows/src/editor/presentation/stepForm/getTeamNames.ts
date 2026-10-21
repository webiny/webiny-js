import type { StepFormReferencesOptions } from "./StepFormOptions.js";
import type { StepFormTeamsOptions } from "./StepFormOptions.js";

/*
 * The names of the teams the form knows by id (R307): the team search results, the chosen teams
 * (their labels win) and the found rule teams. A deleted team has no name to show.
 */
export const getTeamNames = (
    teams: StepFormTeamsOptions,
    references: StepFormReferencesOptions
): ReadonlyMap<string, string> => {
    const names = new Map<string, string>();
    for (const option of teams.options) {
        names.set(option.id, option.label);
    }
    references.teams.forEach((label, id) => {
        if (label.state === "found") {
            names.set(id, label.label);
        }
    });
    for (const option of teams.selected) {
        names.set(option.id, option.label);
    }
    return names;
};

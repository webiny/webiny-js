import { isRecord } from "./isRecord.js";

export interface ReviewConfigValue {
    teams: string[];
    // The stored assignment object, carried unchanged (R270); null when the config has none.
    assignment: Record<string, unknown> | null;
}

export const readReviewConfig = (config: unknown): ReviewConfigValue => {
    if (!isRecord(config)) {
        return { teams: [], assignment: null };
    }
    const teams = Array.isArray(config.teams) ? config.teams : [];
    const assignment = isRecord(config.assignment) ? config.assignment : null;

    return {
        teams: teams.filter((team): team is string => typeof team === "string"),
        assignment
    };
};

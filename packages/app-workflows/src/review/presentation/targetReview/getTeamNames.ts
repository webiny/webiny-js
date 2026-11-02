import type { ReviewStep } from "~/review/domain/types.js";

// The names of the step's candidate teams joined with ", "; empty when none resolved (R232).
export const getTeamNames = (step: ReviewStep): string => {
    return step.candidateTeams.map(team => team.name).join(", ");
};

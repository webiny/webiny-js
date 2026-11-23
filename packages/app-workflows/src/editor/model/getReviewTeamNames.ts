import type { EditorStep } from "~/editor/domain/types.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";

const UNKNOWN_ITEM = "Unknown item";

// The names of the teams a People step reviews with, in the step's order. Pure.
export const getReviewTeamNames = (step: EditorStep, context: StepContext): string[] => {
    const config = readReviewConfig(step.config);
    return config.teams.map(id => {
        const team = context.teams.find(item => item.id === id);
        return team ? team.name : UNKNOWN_ITEM;
    });
};

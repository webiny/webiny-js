import type { ReviewStepConfig, ReviewStepConfigProblem } from "./types.js";

/**
 * The first problem of a parsed review step config, or null when it is valid: no teams, two rules
 * with the same id, or a rule whose team target is not one of the step's teams (spec 4.1, 6). Shared by save
 * (`WorkflowValidator`) and the inspector (R121). User targets need a lookup, so
 * `StoreWorkflowUseCase` checks them (R122).
 */
export const findReviewStepConfigProblem = (
    config: ReviewStepConfig
): ReviewStepConfigProblem | null => {
    if (config.teams.length === 0) {
        return { type: "noTeams" };
    }
    const ruleIds = new Set<string>();
    for (const rule of config.assignment.rules) {
        if (ruleIds.has(rule.id)) {
            return { type: "duplicateRuleId", ruleId: rule.id };
        }
        ruleIds.add(rule.id);
    }
    for (const rule of config.assignment.rules) {
        if (rule.target.type === "team" && !config.teams.includes(rule.target.id)) {
            return { type: "teamTargetOutsideTeams", ruleId: rule.id };
        }
    }
    return null;
};

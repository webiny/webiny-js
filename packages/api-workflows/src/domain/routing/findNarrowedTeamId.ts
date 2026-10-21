import type { RoutingRule } from "~/domain/workflow/types.js";

/**
 * The team a matched team-target rule narrowed the candidates to; null for any other rule. Pure.
 */
export const findNarrowedTeamId = (rules: RoutingRule[], ruleId: string | null): string | null => {
    const rule = rules.find(item => item.id === ruleId);
    if (rule && rule.target.type === "team") {
        return rule.target.id;
    }
    return null;
};

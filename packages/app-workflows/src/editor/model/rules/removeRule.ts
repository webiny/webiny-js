import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

export const removeRule = (rules: RuleValue[], ruleId: string): RuleValue[] => {
    return rules.filter(rule => rule.id !== ruleId);
};

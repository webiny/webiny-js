import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

export const addRule = (rules: RuleValue[], rule: RuleValue): RuleValue[] => {
    return [...rules, rule];
};

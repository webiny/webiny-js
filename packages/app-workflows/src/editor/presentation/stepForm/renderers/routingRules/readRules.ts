import { toJS } from "mobx";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * The rule list of the form field as plain data (R293): the field holds an observable array of
 * observable rules, which becomes plain JSON before it reaches the list helpers; anything that is
 * not a list is an empty list.
 */
export const readRules = (value: unknown): RuleValue[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    const rules: RuleValue[] = toJS(value);
    return rules;
};

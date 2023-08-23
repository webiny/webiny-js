import cloneDeep from "lodash/cloneDeep";
import findIndex from "lodash/findIndex";
import { FbFormStepRule } from "~/types";

interface UpdateRuleConditionsProps {
    prevRules: FbFormStepRule[];
    rule: FbFormStepRule;
    conditionIndex: number;
    conditionProperty: string;
    conditionPropertyValue: string;
}

export const updateRuleConditions = ({
    prevRules,
    rule,
    conditionIndex,
    conditionProperty,
    conditionPropertyValue
}: UpdateRuleConditionsProps) => {
    const ruleIndex = findIndex(prevRules, { id: rule.id });
    const rules = cloneDeep(prevRules);
    const conditions = cloneDeep(rules[ruleIndex].conditions || []);

    conditions[conditionIndex] = {
        ...rules[ruleIndex].conditions[conditionIndex],
        [conditionProperty]: conditionPropertyValue
    };

    rules[ruleIndex].conditions = conditions;

    return rules;
};

import cloneDeep from "lodash/cloneDeep";
import { FbFormRule, FbFormCondition } from "~/types";

interface UpdateRuleConditionsProps {
    rule: FbFormRule;
    conditionIndex: number;
    conditionProperty: keyof FbFormCondition;
    conditionPropertyValue: string;
}

export const updateRuleConditions = ({
    rule,
    conditionIndex,
    conditionProperty,
    conditionPropertyValue
}: UpdateRuleConditionsProps): FbFormRule => {
    const conditions = cloneDeep(rule.conditions || []);

    conditions[conditionIndex] = {
        ...rule.conditions[conditionIndex],
        [conditionProperty]: conditionPropertyValue
    };

    return {
        ...rule,
        conditions
    };
};

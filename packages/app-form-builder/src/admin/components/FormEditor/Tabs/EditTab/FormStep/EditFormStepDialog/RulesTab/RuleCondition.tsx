import React, { useCallback } from "react";

import { RuleCondition, RuleConditionProps } from "../RuleCondition";
import { AddRuleCondition } from "./AddRuleCondition";

export const RuleConditionWrapper = ({
    onChange,
    rule,
    condition,
    ...rest
}: Omit<RuleConditionProps, "onDelete">) => {
    const onDeleteCondition = useCallback(() => {
        return onChange({
            ...rule,
            conditions: rule.conditions.filter(ruleCondition => ruleCondition.id !== condition.id)
        });
    }, [onChange, rule, condition]);

    const showAddConditionButton = condition.id === rule.conditions[rule.conditions.length - 1].id;

    return (
        <>
            <RuleCondition
                rule={rule}
                condition={condition}
                onChange={onChange}
                onDelete={onDeleteCondition}
                {...rest}
            />
            {showAddConditionButton && <AddRuleCondition rule={rule} onChange={onChange} />}
        </>
    );
};

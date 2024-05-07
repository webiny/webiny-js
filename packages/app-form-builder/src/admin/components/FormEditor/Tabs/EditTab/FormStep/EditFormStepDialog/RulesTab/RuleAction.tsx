import React, { useCallback } from "react";

import { FbFormRule, FbFormStep, FbFormRuleAction } from "~/types";
import { SelectRuleAction } from "../SelectRuleAction";

interface RuleActionSelectProps {
    rule: FbFormRule;
    steps: FbFormStep[];
    currentStep: FbFormStep;
    ruleIndex: number;
    onChange: (params: FbFormRule) => void;
}

export const RuleAction = ({
    rule,
    ruleIndex,
    steps,
    currentStep,
    onChange
}: RuleActionSelectProps) => {
    const onChangeAction = useCallback(
        (action: FbFormRuleAction) => {
            return onChange({
                ...rule,
                action
            });
        },
        [rule, onChange, currentStep]
    );

    return (
        <SelectRuleAction
            rule={rule}
            ruleIndex={ruleIndex}
            currentStep={currentStep}
            steps={steps}
            onChange={onChangeAction}
        />
    );
};

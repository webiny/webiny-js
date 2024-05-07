import React from "react";
import { BindComponent } from "@webiny/form/types";

import { AddRuleCondition } from "./AddRuleCondition";
import { RuleConditionWrapper } from "./RuleCondition";
import { RuleAction } from "./RuleAction";

import { FbFormModelField, FbFormRule, FbFormStep } from "~/types";

interface RuleProps {
    bind: BindComponent;
    ruleIndex: number;
    steps: FbFormStep[];
    currentStep: FbFormStep;
    fields: (FbFormModelField | null)[];
}

interface BindParams {
    value: FbFormRule;
    onChange: (value: FbFormRule) => void;
}

export const Rule = ({ bind: Bind, ruleIndex, steps, currentStep, fields }: RuleProps) => {
    return (
        <Bind name={`rules[${ruleIndex}]`}>
            {({ value: rule, onChange }: BindParams) => (
                <>
                    {rule.conditions.length === 0 ? (
                        <AddRuleCondition rule={rule} onChange={onChange} />
                    ) : (
                        <>
                            {rule.conditions.map((condition, conditionIndex) => (
                                <RuleConditionWrapper
                                    key={condition.id}
                                    rule={rule}
                                    condition={condition}
                                    conditionIndex={conditionIndex}
                                    fields={fields}
                                    onChange={onChange}
                                />
                            ))}
                            <RuleAction
                                rule={rule}
                                ruleIndex={ruleIndex}
                                steps={steps}
                                currentStep={currentStep}
                                onChange={onChange}
                            />
                        </>
                    )}
                </>
            )}
        </Bind>
    );
};

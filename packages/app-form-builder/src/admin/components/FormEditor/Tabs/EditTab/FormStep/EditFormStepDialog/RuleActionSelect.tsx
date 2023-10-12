import React, { useState, useEffect } from "react";
import { Select } from "@webiny/ui/Select";
import styled from "@emotion/styled";
import { ruleActionOptions } from "./fieldsValidationConditions";
import { FbFormStep, FbFormRule } from "~/types";

const RuleAction = styled("div")`
    display: flex;
    align-items: center;
    margin-top: 70px;
    position: relative;
    & > span {
        font-size: 22px;
    }
    &::before {
        display: block;
        content: "";
        width: 100%;
        position: absolute;
        top: -25px;
        border-top: 1px solid gray;
    }
`;

const ActionSelect = styled(Select)`
    margin-left: 35px;
    margin-right: 15px;
    width: 250px;
`;

const ActionOptionSelect = styled(Select)`
    width: 250px;
`;

interface Props {
    rule: FbFormRule;
    steps: FbFormStep[];
    currentStep: FbFormStep;
    ruleIndex: number;
    onChangeAction: (value: string) => void;
}

export const RuleActionSelect: React.FC<Props> = ({ rule, steps, currentStep, onChangeAction }) => {
    const defaultActionValue = rule.action === "submit" ? "submit" : "goToStep";
    const [ruleAction, setRuleAction] = useState<string>(defaultActionValue);

    // We can only select steps that are below current step.
    const availableSteps = steps.slice(steps.findIndex(step => step.id === currentStep.id) + 1);

    useEffect(() => {
        if (ruleAction === "submit") {
            onChangeAction("submit");
        }
    }, [ruleAction]);

    return (
        <RuleAction>
            <span>Then</span>
            <ActionSelect
                label="Select rule action"
                placeholder="Select rule action"
                value={ruleAction}
                onChange={val => setRuleAction(val)}
            >
                {ruleActionOptions.map((action, index) => (
                    <option key={index} value={action.value}>
                        {action.label}
                    </option>
                ))}
            </ActionSelect>
            {ruleAction === "goToStep" && (
                <ActionOptionSelect
                    label="Select Step"
                    placeholder="Select Step"
                    value={rule.action}
                    onChange={onChangeAction}
                >
                    {availableSteps.map((step, index) => (
                        <option key={index} value={step.index}>
                            {step.title}
                        </option>
                    ))}
                </ActionOptionSelect>
            )}
        </RuleAction>
    );
};

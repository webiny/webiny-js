import React, { useState, useEffect, useCallback } from "react";
import { Select } from "@webiny/ui/Select";
import styled from "@emotion/styled";
import { ruleActionOptions } from "./fieldsValidationConditions";
import { FbFormStep, FbFormRule, FbFormRuleAction } from "~/types";
import { Input } from "@webiny/ui/Input";

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
    onChange: (action: FbFormRuleAction) => void;
}

export const SelectRuleAction = ({ rule, steps, currentStep, onChange }: Props) => {
    const [ruleAction, setRuleAction] = useState<string>(rule.action.type);

    // We can only select steps that are below current step.
    const availableSteps = steps.slice(steps.findIndex(step => step.id === currentStep.id) + 1);

    useEffect(() => {
        if (ruleAction === "submit") {
            onChange({
                type: "submit",
                value: ""
            });
        }
    }, [ruleAction]);

    const onChangeAction = useCallback(
        (actionValue: string) => {
            return onChange({
                type: ruleAction,
                value: actionValue
            });
        },
        [ruleAction, rule.action.value]
    );

    return (
        <RuleAction>
            <ActionSelect
                label="Rule action"
                placeholder="Rule action"
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
                    label="Step"
                    placeholder="Step"
                    value={rule.action.value}
                    onChange={onChangeAction}
                >
                    {availableSteps.map((step, index) => (
                        <option key={index} value={step.index}>
                            {step.title}
                        </option>
                    ))}
                </ActionOptionSelect>
            )}
            {ruleAction === "submitAndRedirect" && (
                <Input
                    label={"Enter URL"}
                    placeholder={"Enter URL"}
                    value={rule.action.value}
                    onChange={onChangeAction}
                />
            )}
        </RuleAction>
    );
};

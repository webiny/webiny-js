import React, { useCallback } from "react";

import { Rule } from "./Rule";

import { mdbid } from "@webiny/utils";
import { BindComponent } from "@webiny/form/types";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Switch } from "@webiny/ui/Switch";

import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { FbFormModelField, FbFormRule, FbFormStep } from "~/types";
import {
    StyledAddRuleButton,
    AddRuleButtonWrapper,
    AccordionWithShadow
} from "~/admin/components/FormEditor/Tabs/EditTab/Styled";

type OnChangeRulesHandler = (value: FbFormRule[]) => void;

interface RulesProps {
    bind: BindComponent;
    steps: FbFormStep[];
    currentStep: FbFormStep;
    fields: (FbFormModelField | null)[];
}

interface BindParams {
    value: FbFormRule[];
    onChange: OnChangeRulesHandler;
}

interface RulesAccordionProps {
    children: React.ReactElement;
    rules: FbFormRule[];
    rule: FbFormRule;
    ruleIndex: number;
    onChange: OnChangeRulesHandler;
}

const RulesAccordion = ({ children, rule, rules, ruleIndex, onChange }: RulesAccordionProps) => {
    const onDeleteRule = useCallback(() => {
        return onChange(rules.filter(rulesValueItem => rulesValueItem.id !== rule.id));
    }, [rule, onChange]);

    const onChangeConditionChain = useCallback(
        (matchAll: boolean) => {
            rules[ruleIndex] = {
                ...rules[ruleIndex],
                matchAll
            };
            return onChange([...rules]);
        },
        [rule, onChange]
    );

    return (
        <AccordionWithShadow margingap={"10px"}>
            <AccordionItem
                open={true}
                title={rule.title}
                actions={
                    <AccordionItem.Actions>
                        <AccordionItem.Element
                            element={
                                <Switch
                                    label={"Match all conditions"}
                                    value={rule.matchAll}
                                    onChange={onChangeConditionChain}
                                />
                            }
                        />
                        <AccordionItem.Action icon={<DeleteIcon />} onClick={onDeleteRule} />
                    </AccordionItem.Actions>
                }
            >
                {children}
            </AccordionItem>
        </AccordionWithShadow>
    );
};

interface AddRuleButtonProps {
    rules: FbFormRule[];
    onChange: (param: FbFormRule[]) => void;
}

const AddRuleButton = ({ rules, onChange }: AddRuleButtonProps) => {
    const onAddRule = useCallback(() => {
        return onChange([
            ...(rules || []),
            {
                title: "Rule",
                id: mdbid(),
                conditions: [],
                action: {
                    type: "",
                    value: ""
                },
                isValid: true,
                matchAll: false
            }
        ]);
    }, [rules, onChange]);

    return (
        <AddRuleButtonWrapper>
            <StyledAddRuleButton onClick={onAddRule}>+ Add Rule</StyledAddRuleButton>
        </AddRuleButtonWrapper>
    );
};

export const Rules = ({ bind: Bind, steps, currentStep, fields }: RulesProps) => {
    return (
        <Bind name={"rules"}>
            {({ value: rules, onChange }: BindParams) => (
                <>
                    {rules.map((rule, ruleIndex) => (
                        <RulesAccordion
                            key={rule.id}
                            rule={rule}
                            ruleIndex={ruleIndex}
                            rules={rules}
                            onChange={onChange}
                        >
                            <Rule
                                bind={Bind}
                                ruleIndex={ruleIndex}
                                steps={steps}
                                currentStep={currentStep}
                                fields={fields}
                            />
                        </RulesAccordion>
                    ))}
                    <AddRuleButton rules={rules} onChange={onChange} />
                </>
            )}
        </Bind>
    );
};

import React, { useCallback } from "react";

import { mdbid } from "@webiny/utils";
import { Icon } from "@webiny/ui/Icon";
import { BindComponent } from "@webiny/form";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Switch } from "@webiny/ui/Switch";
import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { Rule } from "./Rule";

import {
    AccordionWithShadow,
    StyledAddRuleButton,
    AddRuleButtonWrapper,
    RuleButtonDescription
} from "~/admin/components/FormEditor/Tabs/EditTab/Styled";

import { FbFormModelField, FbFormRule } from "~/types";

interface RulesAccordionProps {
    children: React.ReactNode;
    rules: FbFormRule[];
    rule: FbFormRule;
    ruleIndex: number;
    onChange: (value: FbFormRule[]) => void;
}

const RulesAccordion = ({ children, rules, rule, ruleIndex, onChange }: RulesAccordionProps) => {
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
                    value: "hide"
                },
                isValid: true,
                matchAll: false
            }
        ]);
    }, [rules, onChange]);

    return (
        <AddRuleButtonWrapper>
            <StyledAddRuleButton onClick={onAddRule}>+ Add Rule</StyledAddRuleButton>
            <RuleButtonDescription>
                <Icon icon={<InfoIcon width={14} height={14} />} />
                <span>Click here to learn how field rules work</span>
            </RuleButtonDescription>
        </AddRuleButtonWrapper>
    );
};

interface RulesProps {
    bind: BindComponent;
    fields: (FbFormModelField | null)[];
}

interface BindProps {
    value: FbFormRule[];
    onChange: (params: FbFormRule[]) => void;
}

export const Rules = ({ bind: Bind, fields }: RulesProps) => {
    return (
        <Bind name={"settings.rules"}>
            {({ value: rules, onChange }: BindProps) => (
                <>
                    {rules.map((rule, ruleIndex) => (
                        <RulesAccordion
                            key={rule.id}
                            rule={rule}
                            rules={rules}
                            ruleIndex={ruleIndex}
                            onChange={onChange}
                        >
                            <Rule rules={rules} ruleIndex={ruleIndex} fields={fields} bind={Bind} />
                        </RulesAccordion>
                    ))}
                    <AddRuleButton rules={rules} onChange={onChange} />
                </>
            )}
        </Bind>
    );
};

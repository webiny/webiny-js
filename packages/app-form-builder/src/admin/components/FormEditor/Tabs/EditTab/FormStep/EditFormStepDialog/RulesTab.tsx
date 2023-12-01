import React from "react";
import { Icon } from "@webiny/ui/Icon";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Alert } from "@webiny/ui/Alert";
import { mdbid } from "@webiny/utils";

import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { RuleActionSelect } from "./RuleActionSelect";
import { conditionChainOptions } from "./fieldsValidationConditions";
import { getAvailableFields } from "./helpers";
import {
    RulesTabWrapper,
    AddRuleButtonWrapper,
    RuleButtonDescription,
    StyledAccordion,
    ConditionSetupWrapper,
    AddRuleButton,
    AddConditionButton,
    ConditionsChainSelect
} from "../../Styled";

import { FbFormStep, FbFormModel, FbFormRule } from "~/types";
import { BindComponent } from "@webiny/form/types";
import { RuleCondition } from "./RuleCondition";

interface RulesTabProps {
    bind: BindComponent;
    step: FbFormStep;
    formData: FbFormModel;
}

export const RulesTab = ({ bind: Bind, step, formData }: RulesTabProps) => {
    const fields = getAvailableFields({ step, formData });

    const areRulesBroken = step.rules?.some(rule => rule.isValid === false);
    const isCurrentStepLast =
        formData.steps.findIndex(steps => steps.id === step.id) === formData.steps.length - 1;

    const rulesDisabledMessage = "You cannot add rules to the last step!";

    // We also check whether last step has rules,
    // if yes then we most block ability to add new rules and conditions.
    if (isCurrentStepLast && !step?.rules?.length) {
        return (
            <RulesTabWrapper>
                <h4>{rulesDisabledMessage}</h4>
            </RulesTabWrapper>
        );
    }

    return (
        <RulesTabWrapper>
            {areRulesBroken !== undefined && areRulesBroken === true && (
                <Alert type="warning" title="Rules are broken">
                    <span>
                        At the moment one or more of your rules are broken. To correct the state
                        please check your rules and ensure they are referencing fields that still
                        exists and are place inside the current or one of the previous steps.
                    </span>
                </Alert>
            )}
            <Bind name={"rules"}>
                {({ value: stepRules, onChange: onChangeRules }) => (
                    <>
                        {stepRules &&
                            (stepRules as FbFormRule[]).map((rule, ruleIndex) => (
                                <StyledAccordion key={rule.id} margingap={"10px"}>
                                    <AccordionItem
                                        open={true}
                                        title={rule.title}
                                        actions={
                                            <AccordionItem.Actions>
                                                <AccordionItem.Action
                                                    icon={<DeleteIcon />}
                                                    onClick={() =>
                                                        onChangeRules(
                                                            (stepRules as FbFormRule[]).filter(
                                                                rulesValueItem =>
                                                                    rulesValueItem.id !== rule.id
                                                            )
                                                        )
                                                    }
                                                />
                                            </AccordionItem.Actions>
                                        }
                                    >
                                        <Bind name={`rules[${ruleIndex}]`}>
                                            {({
                                                value: stepRule,
                                                onChange: onChangeRule
                                            }: {
                                                value: FbFormRule;
                                                onChange: (params: any) => void;
                                            }) => (
                                                <>
                                                    {stepRule.conditions.length === 0 ? (
                                                        <AddConditionButton
                                                            onClick={() => {
                                                                onChangeRule({
                                                                    ...stepRule,
                                                                    conditions: [
                                                                        ...(stepRule.conditions ||
                                                                            []),
                                                                        {
                                                                            fieldName: "",
                                                                            filterType: "",
                                                                            filterValue: "",
                                                                            id: mdbid()
                                                                        }
                                                                    ]
                                                                });
                                                            }}
                                                            disabled={isCurrentStepLast}
                                                        >
                                                            + Add Condition
                                                        </AddConditionButton>
                                                    ) : (
                                                        stepRule.conditions.map(
                                                            (condition, conditionIndex) => (
                                                                <ConditionSetupWrapper
                                                                    key={condition.id}
                                                                >
                                                                    <RuleCondition
                                                                        rule={stepRule}
                                                                        condition={condition}
                                                                        conditionIndex={
                                                                            conditionIndex
                                                                        }
                                                                        fields={fields}
                                                                        onChange={onChangeRule}
                                                                        onDelete={() => {
                                                                            onChangeRule({
                                                                                ...stepRule,
                                                                                conditions:
                                                                                    stepRule.conditions.filter(
                                                                                        ruleCondition =>
                                                                                            ruleCondition.id !==
                                                                                            condition.id
                                                                                    )
                                                                            });
                                                                        }}
                                                                    />
                                                                    {condition.id ===
                                                                        stepRule.conditions[
                                                                            stepRule.conditions
                                                                                .length - 1
                                                                        ].id && (
                                                                        <>
                                                                            <AddConditionButton
                                                                                onClick={() => {
                                                                                    onChangeRule({
                                                                                        ...stepRule,
                                                                                        conditions:
                                                                                            [
                                                                                                ...(stepRule.conditions ||
                                                                                                    []),
                                                                                                {
                                                                                                    fieldName:
                                                                                                        "",
                                                                                                    filterType:
                                                                                                        "",
                                                                                                    filterValue:
                                                                                                        "",
                                                                                                    id: mdbid()
                                                                                                }
                                                                                            ]
                                                                                    });
                                                                                }}
                                                                            >
                                                                                + Add Condition
                                                                            </AddConditionButton>
                                                                            <ConditionsChainSelect
                                                                                label="Select Conditions Chain Option"
                                                                                placeholder="Select Conditions Chain Option"
                                                                                value={
                                                                                    stepRule.chain
                                                                                }
                                                                                onChange={val => {
                                                                                    onChangeRule({
                                                                                        ...stepRule,
                                                                                        chain: val
                                                                                    });
                                                                                }}
                                                                            >
                                                                                {conditionChainOptions.map(
                                                                                    (
                                                                                        chainOption,
                                                                                        index
                                                                                    ) => (
                                                                                        <option
                                                                                            key={
                                                                                                index
                                                                                            }
                                                                                            value={
                                                                                                chainOption.value
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                chainOption.label
                                                                                            }
                                                                                        </option>
                                                                                    )
                                                                                )}
                                                                            </ConditionsChainSelect>
                                                                            <RuleActionSelect
                                                                                rule={stepRule}
                                                                                currentStep={step}
                                                                                ruleIndex={
                                                                                    ruleIndex
                                                                                }
                                                                                steps={
                                                                                    formData.steps
                                                                                }
                                                                                onChangeAction={val => {
                                                                                    onChangeRule({
                                                                                        ...stepRule,
                                                                                        action: val
                                                                                    });
                                                                                }}
                                                                            />
                                                                        </>
                                                                    )}
                                                                </ConditionSetupWrapper>
                                                            )
                                                        )
                                                    )}
                                                </>
                                            )}
                                        </Bind>
                                    </AccordionItem>
                                </StyledAccordion>
                            ))}
                        <AddRuleButtonWrapper>
                            <AddRuleButton
                                onClick={() => {
                                    onChangeRules([
                                        ...(stepRules || []),
                                        {
                                            title: "Rule",
                                            id: mdbid(),
                                            conditions: [],
                                            action: "hide",
                                            isValid: true,
                                            chain: "matchAny"
                                        }
                                    ]);
                                }}
                            >
                                + Add Rule
                            </AddRuleButton>
                            <RuleButtonDescription>
                                <Icon icon={<InfoIcon width={14} height={14} />} />
                                <span>Click here to learn how step rules work</span>
                            </RuleButtonDescription>
                        </AddRuleButtonWrapper>
                    </>
                )}
            </Bind>
        </RulesTabWrapper>
    );
};

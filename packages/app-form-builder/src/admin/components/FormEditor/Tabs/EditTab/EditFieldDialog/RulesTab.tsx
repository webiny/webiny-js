import React from "react";

import { FormRenderPropParams } from "@webiny/form";
import { Icon } from "@webiny/ui/Icon";
import { AccordionItem } from "@webiny/ui/Accordion";
import { mdbid } from "@webiny/utils";

import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { RuleCondition } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/EditFormStepDialog/RuleCondition";
import { conditionChainOptions } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/EditFormStepDialog/fieldsValidationConditions";
import {
    RulesTabWrapper,
    AddRuleButtonWrapper,
    RuleButtonDescription,
    StyledAccordion,
    ConditionSetupWrapper,
    AddRuleButton,
    AddConditionButton,
    ConditionsChainSelect
} from "~/admin/components/FormEditor/Tabs/EditTab/Styled";
import { useFormEditor } from "~/admin/components/FormEditor/Context";
import { RuleActionSelect } from "./RuleActionSelect";
import { FbFormModelField, FbFormModel, FbFormStepRule, FbFormStepCondition } from "~/types";

const getFields = (id: string, formData: FbFormModel) => {
    const filedIds = formData.steps.map(step => step.layout).flat(2);
    const currentFieldIndex = filedIds.indexOf(id);
    const availableFiledIds = filedIds.slice(0, currentFieldIndex);

    return availableFiledIds.map(id => formData.fields.find(field => field._id === id) || null);
};

interface RulesTabProps {
    field: FbFormModelField;
    form: FormRenderPropParams;
}

export const RulesTab = ({ field, form }: RulesTabProps) => {
    const { Bind } = form;

    const { data: formData } = useFormEditor();
    const fields = field._id ? getFields(field._id, formData) : [];

    return (
        <RulesTabWrapper>
            <Bind name={"settings.rules"}>
                {({ value: rulesValue, onChange: onChangeRules }) => (
                    <>
                        {rulesValue &&
                            (rulesValue as FbFormStepRule[]).map((rule, ruleIndex) => (
                                <StyledAccordion key={rule.id}>
                                    <AccordionItem
                                        open={true}
                                        title={rule.title}
                                        actions={
                                            <AccordionItem.Actions>
                                                <AccordionItem.Action
                                                    icon={<DeleteIcon />}
                                                    onClick={() =>
                                                        onChangeRules(
                                                            (rulesValue as FbFormStepRule[]).filter(
                                                                rulesValueItem =>
                                                                    rulesValueItem.id !== rule.id
                                                            )
                                                        )
                                                    }
                                                />
                                            </AccordionItem.Actions>
                                        }
                                    >
                                        <Bind name={`settings.rules[${ruleIndex}]`}>
                                            {({ value: ruleValue, onChange: onChangeRule }) => (
                                                <>
                                                    {rule.conditions.length === 0 ? (
                                                        <AddConditionButton
                                                            onClick={() =>
                                                                onChangeRule({
                                                                    ...ruleValue,
                                                                    conditions: [
                                                                        ...(ruleValue.conditions ||
                                                                            []),
                                                                        {
                                                                            fieldName: "",
                                                                            filterType: "",
                                                                            filterValue: "",
                                                                            id: mdbid()
                                                                        }
                                                                    ]
                                                                })
                                                            }
                                                        >
                                                            + Add Condition
                                                        </AddConditionButton>
                                                    ) : (
                                                        <>
                                                            {ruleValue.conditions.map(
                                                                (
                                                                    condition: FbFormStepCondition,
                                                                    conditionIndex: number
                                                                ) => {
                                                                    return (
                                                                        <ConditionSetupWrapper
                                                                            key={condition.id}
                                                                        >
                                                                            <RuleCondition
                                                                                rule={ruleValue}
                                                                                condition={
                                                                                    condition
                                                                                }
                                                                                fields={fields}
                                                                                deleteCondition={() =>
                                                                                    onChangeRule({
                                                                                        ...ruleValue,
                                                                                        conditions:
                                                                                            (
                                                                                                ruleValue.conditions as FbFormStepCondition[]
                                                                                            ).filter(
                                                                                                ruleValueCondition =>
                                                                                                    ruleValueCondition.id !==
                                                                                                    condition.id
                                                                                            )
                                                                                    })
                                                                                }
                                                                                setRules={() => {
                                                                                    console.log(
                                                                                        "Condition changed"
                                                                                    );
                                                                                }}
                                                                                conditionIndex={
                                                                                    conditionIndex
                                                                                }
                                                                            />
                                                                            {condition.id ===
                                                                                ruleValue
                                                                                    .conditions[
                                                                                    ruleValue
                                                                                        .conditions
                                                                                        .length - 1
                                                                                ].id && (
                                                                                <>
                                                                                    <AddConditionButton
                                                                                        onClick={() =>
                                                                                            onChangeRule(
                                                                                                {
                                                                                                    ...ruleValue,
                                                                                                    conditions:
                                                                                                        [
                                                                                                            ...(ruleValue.conditions ||
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
                                                                                                }
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        + Add
                                                                                        Condition
                                                                                    </AddConditionButton>
                                                                                    <ConditionsChainSelect
                                                                                        label="Select Conditions Chain Option"
                                                                                        placeholder="Select Conditions Chain Option"
                                                                                        value={
                                                                                            ruleValue.chain
                                                                                        }
                                                                                        onChange={val =>
                                                                                            onChangeRule(
                                                                                                {
                                                                                                    ...ruleValue,
                                                                                                    chain: val
                                                                                                }
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        {conditionChainOptions.map(
                                                                                            chainOption => (
                                                                                                <option
                                                                                                    key={`${chainOption.label}-${chainOption.value}`}
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
                                                                                        value={
                                                                                            ruleValue.action
                                                                                        }
                                                                                        onChange={val =>
                                                                                            onChangeRule(
                                                                                                {
                                                                                                    ...ruleValue,
                                                                                                    action: val
                                                                                                }
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </>
                                                                            )}
                                                                        </ConditionSetupWrapper>
                                                                    );
                                                                }
                                                            )}
                                                        </>
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
                                        ...(rulesValue || []),
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
                                <span>Click here to learn how field rules work</span>
                            </RuleButtonDescription>
                        </AddRuleButtonWrapper>
                    </>
                )}
            </Bind>
        </RulesTabWrapper>
    );
};

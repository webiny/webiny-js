import React from "react";

import { FormRenderPropParams } from "@webiny/form";
import { Icon } from "@webiny/ui/Icon";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Alert } from "@webiny/ui/Alert";
import { mdbid } from "@webiny/utils";

import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { RuleConditions } from "./RulesConditions";
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
import { SelectDefaultBehaviour } from "./DefaultBehaviour";
import { FbFormModelField, FbFormModel, FbFormRule, FbFormCondition } from "~/types";

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
    const areRulesInValid = field?.settings?.rules?.some(
        (rule: FbFormRule) => rule.isValid === false
    );

    return (
        <RulesTabWrapper>
            {areRulesInValid && (
                <Alert title="Rules are broken" type="danger">
                    <span>
                        At the moment one or more of your rules are broken. To correct the state
                        please check your rules and ensure they are referencing fields that still
                        exists and are place inside the current or one of the previous steps.
                    </span>
                </Alert>
            )}
            <Bind name={"settings.defaultBehaviour"}>
                {({ value: defaultBehaviourValue, onChange: onChangeDefaultBehaviour }) => (
                    <SelectDefaultBehaviour
                        defaultBehaviourValue={defaultBehaviourValue}
                        onChange={onChangeDefaultBehaviour}
                    />
                )}
            </Bind>
            <Bind name={"settings.rules"}>
                {({ value: rulesValue, onChange: onChangeRules }) => (
                    <>
                        {rulesValue &&
                            (rulesValue as FbFormRule[]).map((rule, ruleIndex) => (
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
                                                            (rulesValue as FbFormRule[]).filter(
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
                                                                    condition: FbFormCondition,
                                                                    conditionIndex: number
                                                                ) => {
                                                                    return (
                                                                        <ConditionSetupWrapper
                                                                            key={condition.id}
                                                                        >
                                                                            <RuleConditions
                                                                                rule={ruleValue}
                                                                                condition={
                                                                                    condition
                                                                                }
                                                                                onChangeRule={
                                                                                    onChangeRule
                                                                                }
                                                                                fields={fields}
                                                                                rulesValue={
                                                                                    rulesValue
                                                                                }
                                                                                conditionIndex={
                                                                                    conditionIndex
                                                                                }
                                                                                deleteCondition={() =>
                                                                                    onChangeRule({
                                                                                        ...ruleValue,
                                                                                        conditions:
                                                                                            (
                                                                                                ruleValue.conditions as FbFormCondition[]
                                                                                            ).filter(
                                                                                                ruleValueCondition =>
                                                                                                    ruleValueCondition.id !==
                                                                                                    condition.id
                                                                                            )
                                                                                    })
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

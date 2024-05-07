import React, { useCallback } from "react";
import { mdbid } from "@webiny/utils";
import styled from "@emotion/styled";

import { Select } from "@webiny/ui/Select";
import { IconButton } from "@webiny/ui/Button";

import { fieldConditionOptions } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/EditFormStepDialog/fieldsValidationConditions";
import { renderConditionValueController } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/EditFormStepDialog/renderConditionValueController";

import { AddConditionButton } from "~/admin/components/FormEditor/Tabs/EditTab/Styled";

import { ReactComponent as AddIcon } from "@material-design-icons/svg/outlined/add_circle_outline.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import cloneDeep from "lodash/cloneDeep";
import findIndex from "lodash/findIndex";
import { FbFormModelField, FbFormCondition, FbFormRule } from "~/types";

const SelectFieldWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 15px 0;
    & > span {
        font-size: 22px;
    }
`;

const FieldSelect = styled(Select)`
    flex-basis: 35%;
`;

const SelectCondition = styled(Select)`
    flex-basis: 20%;
`;

const ConditionValue = styled.div`
    flex-basis: 35%;
`;

const ConditionsChain = styled.div`
    text-align: center;
    font-size: 12px;
    margin-top: 10px;
`;

interface AddConditionProps {
    rule: FbFormRule;
    onChange: (params: FbFormRule) => void;
}

export const AddCondition = ({ rule, onChange }: AddConditionProps) => {
    const onAddCondition = useCallback(() => {
        return onChange({
            ...rule,
            conditions: [
                ...(rule.conditions || []),
                {
                    fieldName: "",
                    filterType: "",
                    filterValue: "",
                    id: mdbid()
                }
            ]
        });
    }, [rule, onChange]);

    return (
        <AddConditionButton onClick={onAddCondition}>
            <IconButton icon={<AddIcon />} />
        </AddConditionButton>
    );
};

interface Props {
    rule: FbFormRule;
    condition: FbFormCondition;
    fields: (FbFormModelField | null)[];
    rules: Array<FbFormRule>;
    conditionIndex: number;
    onChange: (params: FbFormRule) => void;
}

export const RuleConditions = ({
    rules,
    fields,
    condition,
    rule,
    conditionIndex,
    onChange
}: Props) => {
    const fieldType = fields.find(field => field?.fieldId === condition?.fieldName)?.type || "";

    const handleCondition = useCallback(
        (property: string, value: string) => {
            const ruleIndex = findIndex(rules, { id: rule.id });
            const conditions = cloneDeep(rules[ruleIndex].conditions || []);

            conditions[conditionIndex] = {
                ...rules[ruleIndex].conditions[conditionIndex],
                [property]: value
            };

            rules[ruleIndex].conditions = conditions;

            return onChange({
                ...rule,
                conditions
            });
        },
        [condition, rule, onChange]
    );

    const onDeleteCondition = useCallback(() => {
        return onChange({
            ...rule,
            conditions: (rule.conditions as FbFormCondition[]).filter(
                ruleValueCondition => ruleValueCondition.id !== condition.id
            )
        });
    }, [condition, rule, onChange]);

    const showAddConditionButton = condition.id === rule.conditions[rule.conditions.length - 1].id;

    return (
        <>
            <SelectFieldWrapper>
                <FieldSelect
                    label="Field"
                    placeholder="Field"
                    value={condition.fieldName}
                    onChange={value => handleCondition("fieldName", value)}
                >
                    {fields.map((field: any) => (
                        <option key={`${field?.fieldId}#${field?.label}`} value={field?.fieldId}>
                            {field?.label}
                        </option>
                    ))}
                </FieldSelect>
                <SelectCondition
                    label="Condtion"
                    placeholder="Condtion"
                    onChange={val => handleCondition("filterType", val)}
                    value={condition.filterType}
                >
                    {fieldConditionOptions
                        .find(filter => filter.type === fieldType)
                        ?.options.map(option => (
                            <option key={`--${option.label}--`} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                </SelectCondition>
                {/* This field depends on selected field type */}
                <ConditionValue>
                    {renderConditionValueController({
                        condition,
                        fields,
                        handleOnChange: handleCondition
                    })}
                </ConditionValue>
                <IconButton icon={<DeleteIcon onClick={onDeleteCondition} />} />
            </SelectFieldWrapper>
            <ConditionsChain>
                {rule.conditions.length > 1 ? (rule.matchAll ? "AND" : "OR") : null}
            </ConditionsChain>
            {showAddConditionButton && <AddCondition rule={rule} onChange={onChange} />}
        </>
    );
};

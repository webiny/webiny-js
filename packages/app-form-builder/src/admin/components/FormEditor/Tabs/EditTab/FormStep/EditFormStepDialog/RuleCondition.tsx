import React from "react";
import { Select } from "@webiny/ui/Select";
import styled from "@emotion/styled";
import { FbFormModelField } from "~/types";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { fieldConditionOptions } from "./fieldsValidationConditions";
import { FbFormRule, FbFormCondition } from "~/types";
import { renderConditionValueController } from "./renderConditionValueController";
import { updateRuleConditions } from "./updateRuleConditions";

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

export interface RuleConditionProps {
    condition: FbFormCondition;
    rule: FbFormRule;
    fields: (FbFormModelField | null)[];
    conditionIndex: number;
    onChange: (rule: FbFormRule) => void;
    onDelete: () => void;
}

export const RuleCondition = (params: RuleConditionProps) => {
    const { condition, rule, fields, conditionIndex, onChange, onDelete } = params;
    const fieldType = fields.find(field => field?.fieldId === condition.fieldName)?.type || "";

    const handleOnChange = (
        conditionProperty: keyof FbFormCondition,
        conditionPropertyValue: string
    ) => {
        onChange(
            updateRuleConditions({
                rule: rule,
                conditionIndex,
                conditionProperty,
                conditionPropertyValue
            })
        );
    };

    return (
        <>
            <SelectFieldWrapper>
                <FieldSelect
                    label="Field"
                    placeholder="Field"
                    value={condition.fieldName}
                    onChange={value => handleOnChange("fieldName", value)}
                >
                    {fields.map((field, index) => (
                        <option key={index} value={field?.fieldId}>
                            {field?.label}
                        </option>
                    ))}
                </FieldSelect>
                <SelectCondition
                    label="Condition"
                    placeholder="Condition"
                    value={condition.filterType}
                    onChange={value => handleOnChange("filterType", value)}
                >
                    {fieldConditionOptions
                        .find(filter => filter.type === fieldType)
                        ?.options.map((option, index) => (
                            <option key={index} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                </SelectCondition>
                {/* This field depends on selected field type */}
                <ConditionValue>
                    {renderConditionValueController({
                        condition,
                        fields,
                        handleOnChange
                    })}
                </ConditionValue>
                <IconButton icon={<DeleteIcon onClick={onDelete} />} />
            </SelectFieldWrapper>
            <ConditionsChain>
                {rule.conditions.length > 1 ? (rule.matchAll ? "AND" : "OR") : null}
            </ConditionsChain>
        </>
    );
};

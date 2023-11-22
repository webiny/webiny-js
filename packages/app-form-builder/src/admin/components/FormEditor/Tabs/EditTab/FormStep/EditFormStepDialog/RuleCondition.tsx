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
    margin: 15px 0;
    & > span {
        font-size: 22px;
    }
`;

const CondtionsWrapper = styled.div`
    display: flex;
    margin-left: 20px;
`;

const SelectCondition = styled(Select)`
    margin-right: 15px;
    margin-left: 63px;
    width: 250px;
`;

const ConditionValue = styled.div`
    width: 397px;
`;

const FieldSelect = styled(Select)`
    margin-left: 70px;
`;

interface Params {
    condition: FbFormCondition;
    rule: FbFormRule;
    fields: (FbFormModelField | null)[];
    conditionIndex: number;
    onChange: (rule: FbFormRule) => void;
    onDelete: () => void;
}

export const RuleCondition: React.FC<Params> = params => {
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
                <span>If</span>
                <FieldSelect
                    label="Select Field"
                    placeholder="Select Field"
                    value={condition.fieldName}
                    onChange={value => handleOnChange("fieldName", value)}
                >
                    {fields.map((field, index) => (
                        <option key={index} value={field?.fieldId}>
                            {field?.label}
                        </option>
                    ))}
                </FieldSelect>
                <IconButton icon={<DeleteIcon onClick={onDelete} />} />
            </SelectFieldWrapper>
            {!condition.fieldName ? (
                <></>
            ) : (
                <CondtionsWrapper>
                    <SelectCondition
                        label="Select Condtion"
                        placeholder="Select Condtion"
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
                </CondtionsWrapper>
            )}
        </>
    );
};

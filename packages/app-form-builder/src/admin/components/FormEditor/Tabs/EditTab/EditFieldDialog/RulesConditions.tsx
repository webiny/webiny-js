import React from "react";
import styled from "@emotion/styled";

import { Select } from "@webiny/ui/Select";
import { IconButton } from "@webiny/ui/Button";

import { fieldConditionOptions } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/EditFormStepDialog/fieldsValidationConditions";
import { renderConditionValueController } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/EditFormStepDialog/renderConditionValueController";

import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import cloneDeep from "lodash/cloneDeep";
import findIndex from "lodash/findIndex";
import { FbFormModelField, FbFormCondition, FbFormRule } from "~/types";

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

interface Props {
    rule: FbFormRule;
    condition: FbFormCondition;
    fields: (FbFormModelField | null)[];
    rulesValue: Array<FbFormRule>;
    conditionIndex: number;
    onChangeRule: (params: FbFormRule) => void;
    deleteCondition: () => void;
}

export const RuleConditions: React.FC<Props> = ({
    rulesValue,
    fields,
    condition,
    rule,
    conditionIndex,
    onChangeRule,
    deleteCondition
}) => {
    const fieldType = fields.find(field => field?.fieldId === condition?.fieldName)?.type || "";

    const onChange = (property: string, value: string) => {
        const ruleIndex = findIndex(rulesValue, { id: rule.id });
        const rules = cloneDeep(rulesValue);
        const conditions = cloneDeep(rules[ruleIndex].conditions || []);

        conditions[conditionIndex] = {
            ...rules[ruleIndex].conditions[conditionIndex],
            [property]: value
        };

        rules[ruleIndex].conditions = conditions;

        onChangeRule({
            ...rule,
            conditions
        });
    };

    return (
        <>
            <SelectFieldWrapper>
                <span>If</span>
                <FieldSelect
                    label="Select Field"
                    placeholder="Select Field"
                    value={condition.fieldName}
                    onChange={value => onChange("fieldName", value)}
                >
                    {fields.map((field: any) => (
                        <option key={`${field?.fieldId}#${field?.label}`} value={field?.fieldId}>
                            {field?.label}
                        </option>
                    ))}
                </FieldSelect>
                <IconButton icon={<DeleteIcon onClick={() => deleteCondition()} />} />
            </SelectFieldWrapper>
            {!condition.fieldName ? (
                <></>
            ) : (
                <CondtionsWrapper>
                    <SelectCondition
                        label="Select Condtion"
                        placeholder="Select Condtion"
                        onChange={val => onChange("filterType", val)}
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
                            handleOnChange: onChange
                        })}
                    </ConditionValue>
                </CondtionsWrapper>
            )}
        </>
    );
};

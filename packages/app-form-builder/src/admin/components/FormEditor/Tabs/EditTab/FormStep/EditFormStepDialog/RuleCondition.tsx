import React, { Dispatch, SetStateAction } from "react";
import { Select } from "@webiny/ui/Select";
import styled from "@emotion/styled";
import { FbFormModelField } from "~/types";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { fieldConditionOptions } from "./fieldsValidationConditions";
import { FbFormStepRule, FbFormStepCondition, FbFormStep } from "~/types";
import { renderConditionValueController } from "./renderConditionValueController";
import { updateRuleConditions } from "./updateRuleConditions";

interface Props {
    condition: FbFormStepCondition;
    rule: FbFormStepRule;
    fields: (FbFormModelField | null)[];
    conditionIndex: number;
    deleteCondition: (ruleId: string, conditionId: string) => void;
    setRules: Dispatch<SetStateAction<FbFormStep["rules"]>>;
}

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

export const RuleCondition: React.FC<Props> = props => {
    const { fields, deleteCondition, setRules, conditionIndex } = props;
    const [condition, setCondition] = React.useState<FbFormStepCondition>(props.condition);
    const fieldType = fields.find(field => field?.fieldId === condition?.fieldName)?.type || "";
    const fieldSettings =
        fields.find(field => field?.fieldId === condition?.fieldName)?.settings || "";

    const fieldOptions = fields.find(
        field => field?.fieldId === props.condition?.fieldName
    )?.options;

    const editRule = (conditionProperty: string, conditionPropertyValue: string) => {
        setRules(prevRules => {
            return updateRuleConditions({
                prevRules,
                rule: props.rule,
                conditionIndex,
                conditionProperty,
                conditionPropertyValue
            });
        });
    };

    const handleCondition = (property: string, val: string) => {
        setCondition(prevState => ({
            ...prevState,
            [property]: val
        }));
        editRule(property, val);
    };

    return (
        <>
            <SelectFieldWrapper>
                <span>If</span>
                <FieldSelect
                    label="Select Field"
                    placeholder="Select Field"
                    onChange={val => handleCondition("fieldName", val)}
                    value={condition?.fieldName || ""}
                >
                    {props.fields.map(field => {
                        return (
                            <option
                                key={`${field?.fieldId}#${field?.label}`}
                                value={field?.fieldId}
                            >
                                {field?.label}
                            </option>
                        );
                    })}
                </FieldSelect>
                <IconButton
                    icon={
                        <DeleteIcon
                            onClick={() => deleteCondition(props.rule.id, props.condition.id)}
                        />
                    }
                />
            </SelectFieldWrapper>
            {!condition.fieldName ? (
                <></>
            ) : (
                <CondtionsWrapper>
                    <SelectCondition
                        label="Select Condtion"
                        placeholder="Select Condtion"
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
                            fieldOptions,
                            fieldType,
                            fieldSettings,
                            handleCondition
                        })}
                    </ConditionValue>
                </CondtionsWrapper>
            )}
        </>
    );
};

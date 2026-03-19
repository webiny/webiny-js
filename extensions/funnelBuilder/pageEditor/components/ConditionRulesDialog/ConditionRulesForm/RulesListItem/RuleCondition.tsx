import React from "react";
import { IconButton, Select } from "webiny/admin/ui";
import styled from "@emotion/styled";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { FunnelConditionGroupModelDto } from "../../../../../models/FunnelConditionGroupModel";
import { useConditionRulesForm } from "../../useConditionRulesForm";
import { getConditionOperatorsByValueType } from "../../../../../models/conditionOperators/conditionOperatorFactory";
import { FunnelConditionModelDto } from "../../../../../models/FunnelConditionModel";

const Fieldset = styled.div`
    display: flex;
    align-items: center;
    column-gap: 10px;
    position: relative;
    width: 100%;
`;

interface RuleConditionGroupProps {
    conditionGroup: FunnelConditionGroupModelDto;
    condition: FunnelConditionModelDto;
}

export const RuleCondition = ({ conditionGroup, condition }: RuleConditionGroupProps) => {
    const { funnel, removeCondition, updateCondition } = useConditionRulesForm();

    const fieldDefinition = funnel.fields.find(f => f.id === condition.sourceFieldId);

    const availableConditionOperators = getConditionOperatorsByValueType(
        fieldDefinition?.value?.type || ""
    );

    return (
        <Fieldset>
            <Select
                size={"md"}
                value={condition.sourceFieldId}
                placeholder={"Select field..."}
                onChange={value => {
                    return updateCondition(conditionGroup.id, {
                        ...condition,
                        sourceFieldId: value
                    });
                }}
                options={funnel.fields.map(field => ({
                    value: field.id,
                    label: field.label!
                }))}
            />

            <Select
                size={"md"}
                value={condition.operator.type}
                placeholder={"Select operator..."}
                onChange={type => {
                    return updateCondition(conditionGroup.id, {
                        ...condition,
                        operator: { type, params: { extra: {} } }
                    });
                }}
                options={availableConditionOperators.map(operator => ({
                    value: operator.type,
                    label: operator.optionLabel
                }))}
            />

            <IconButton
                icon={<DeleteIcon />}
                onClick={() => removeCondition(conditionGroup.id, condition.id)}
            />
        </Fieldset>
    );
};

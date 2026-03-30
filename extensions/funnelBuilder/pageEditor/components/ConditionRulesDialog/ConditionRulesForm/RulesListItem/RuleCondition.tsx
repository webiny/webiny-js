import React from "react";
import { IconButton, Select } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/delete.svg";
import { FunnelConditionGroupModelDto } from "../../../../../models/FunnelConditionGroupModel";
import { useConditionRulesForm } from "../../useConditionRulesForm";
import { getConditionOperatorsByValueType } from "../../../../../models/conditionOperators/conditionOperatorFactory";
import { FunnelConditionModelDto } from "../../../../../models/FunnelConditionModel";

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
        <div className={"flex items-center gap-xs relative w-full"}>
            <Select
                size={"md"}
                value={condition.sourceFieldId}
                displayResetAction={false}
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
                displayResetAction={false}
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
                variant={"ghost"}
                onClick={() => removeCondition(conditionGroup.id, condition.id)}
            />
        </div>
    );
};

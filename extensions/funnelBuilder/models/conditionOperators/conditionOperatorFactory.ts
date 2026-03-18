import { type FunnelConditionOperatorModelDto } from "../FunnelConditionOperatorModel";
import { registry } from "./registry";

export const getConditionOperatorsByValueType = (valueType: string) => {
    return registry.filter(operatorClass => {
        return (
            operatorClass.supportedFieldValueTypes.includes("*") ||
            operatorClass.supportedFieldValueTypes.includes(valueType)
        );
    });
};

export const conditionOperatorFromDto = (dto: FunnelConditionOperatorModelDto) => {
    const OperatorClass = registry.find(operatorClass => operatorClass.type === dto.type);
    if (!OperatorClass) {
        throw new Error(`Unknown condition operator: ${dto.type}`);
    }
    return new OperatorClass(dto);
};

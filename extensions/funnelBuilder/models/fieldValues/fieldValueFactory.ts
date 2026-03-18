import { type FunnelFieldValueModelDto } from "../FunnelFieldValueModel";
import { registry } from "./registry";

export const fieldValueFromDto = (dto: FunnelFieldValueModelDto<any>) => {
    const FieldValueClass = registry.find(fieldValueClass => fieldValueClass.type === dto.type);
    if (!FieldValueClass) {
        throw new Error(`Unknown field value: ${dto.type}`);
    }
    return new FieldValueClass(dto);
};

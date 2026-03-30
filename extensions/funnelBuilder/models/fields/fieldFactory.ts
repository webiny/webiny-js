import { FunnelFieldDefinitionModelDto } from "../FunnelFieldDefinitionModel";
import { registry } from "./registry";

export const fieldFromDto = (dto: FunnelFieldDefinitionModelDto<any, any>) => {
    const FieldDefinitionClass = registry.find(
        fieldDefinitionClass => fieldDefinitionClass.type === dto.type
    );
    if (!FieldDefinitionClass) {
        throw new Error(`Unknown field: ${dto.type}`);
    }

    // @ts-ignore asd
    return new FieldDefinitionClass(dto);
};

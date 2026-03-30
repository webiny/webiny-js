import {
    FunnelFieldDefinitionModel,
    FunnelFieldDefinitionModelDto
} from "../FunnelFieldDefinitionModel";

export type NumberFieldDto = Omit<FunnelFieldDefinitionModelDto<number, NumberFieldExtra>, "type">;

export interface NumberFieldExtra {
    placeholderText: string;
}

export class NumberField extends FunnelFieldDefinitionModel<number, NumberFieldExtra> {
    static override type = "number";
    override supportedValidatorTypes = ["required", "gte", "lte"];

    constructor(dto: NumberFieldDto) {
        super({
            ...dto,
            value: { type: "number", array: false, value: dto?.value?.value || 0 },
            type: "number",
            extra: dto.extra || { placeholderText: "" }
        });
    }
}

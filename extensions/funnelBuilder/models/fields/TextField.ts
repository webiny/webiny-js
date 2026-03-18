import {
    FunnelFieldDefinitionModel,
    FunnelFieldDefinitionModelDto
} from "../FunnelFieldDefinitionModel";

export type TextFieldDto = Omit<FunnelFieldDefinitionModelDto<string, TextFieldExtra>, "type">;

export interface TextFieldExtra {
    placeholderText: string;
}

export class TextField extends FunnelFieldDefinitionModel<string, TextFieldExtra> {
    static override type = "text";
    override supportedValidatorTypes = ["required", "minLength", "maxLength", "pattern"];

    constructor(dto: TextFieldDto) {
        super({
            ...dto,
            value: { type: "string", array: false, value: dto?.value?.value || "" },
            type: "text",
            extra: dto.extra || { placeholderText: "" }
        });
    }
}

import {
    FunnelFieldDefinitionModel,
    FunnelFieldDefinitionModelDto
} from "../FunnelFieldDefinitionModel";

export type TextareaFieldDto = Omit<
    FunnelFieldDefinitionModelDto<string, TextareaFieldExtra>,
    "type"
>;

export interface TextareaFieldExtra {
    placeholderText: string;
    rows: number;
}

export class TextareaField extends FunnelFieldDefinitionModel<string, TextareaFieldExtra> {
    static override type = "textarea";
    override supportedValidatorTypes = ["required", "minLength", "maxLength", "pattern"];

    constructor(dto: TextareaFieldDto) {
        super({
            ...dto,
            value: { type: "string", array: false, value: dto?.value?.value || "" },
            type: "textarea",
            extra: dto.extra || { placeholderText: "", rows: 4 }
        });
    }
}

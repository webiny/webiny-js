import {
    FunnelFieldDefinitionModel,
    FunnelFieldDefinitionModelDto
} from "../FunnelFieldDefinitionModel";

export type CheckboxGroupFieldDto = Omit<
    FunnelFieldDefinitionModelDto<string[], CheckboxGroupFieldExtra>,
    "type"
>;

export interface CheckboxGroupFieldExtra {
    options: Array<{ id: string; value: string; label: string }>;
}

export class CheckboxGroupField extends FunnelFieldDefinitionModel<
    string[],
    CheckboxGroupFieldExtra
> {
    static override type = "checkboxGroup";
    override supportedValidatorTypes = ["required"];

    constructor(dto: CheckboxGroupFieldDto) {
        super({
            ...dto,
            value: { type: "stringArray", array: true, value: dto?.value?.value || [] },
            type: "checkboxGroup",
            extra: dto.extra || { options: [] }
        });
    }
}

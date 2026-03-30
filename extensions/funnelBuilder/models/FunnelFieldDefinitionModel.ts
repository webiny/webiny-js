import { AbstractValidator, FieldValidatorDto } from "./validators/AbstractValidator";
import { validatorFromDto } from "./validators/validatorFactory";
import { createObjectHash } from "../utils/createObjectHash";
import { FunnelFieldValueModel, FunnelFieldValueModelDto } from "./FunnelFieldValueModel";
import { getRandomId } from "../utils/getRandomId";

export interface FunnelFieldDefinitionModelDto<TValue = unknown, TExtra = Record<string, any>> {
    id?: string;
    fieldId?: string;
    stepId: string;
    type: string;
    label?: string;
    helpText?: string;
    validators?: FieldValidatorDto[];

    // Defines the value type the field carries. Optionally, it allows
    // for default value assignment (for example, for checkboxes).
    value?: FunnelFieldValueModelDto<TValue>;
    extra?: TExtra;
}

export class FunnelFieldDefinitionModel<
    TValue = unknown,
    TExtra extends Record<string, any> = Record<string, any>
> {
    static type = "";

    id: string;
    type: string;
    stepId: string;
    fieldId: string;
    label: string;
    helpText: string;
    validators: AbstractValidator[];

    // Defines the value type the field carries. Optionally, it allows
    // for default value assignment (for example, for checkboxes).
    value: FunnelFieldValueModel<TValue>;

    extra: TExtra;

    // Meta fields.
    supportedValidatorTypes: string[] = [];

    constructor(dto: FunnelFieldDefinitionModelDto<TValue, TExtra>) {
        this.id = dto.id || getRandomId();
        this.fieldId = dto.fieldId || getRandomId();
        this.stepId = dto.stepId;
        this.type = dto.type;
        this.label = dto.label || "";
        this.helpText = dto.helpText || "";
        this.validators = dto.validators?.map(validatorFromDto) ?? [];
        this.value = FunnelFieldValueModel.fromDto<TValue>(
            dto.value as FunnelFieldValueModelDto<TValue>
        );
        this.extra = (dto.extra ?? {}) as TExtra;
    }

    toDto(): FunnelFieldDefinitionModelDto<TValue> {
        return {
            id: this.id,
            fieldId: this.fieldId,
            stepId: this.stepId,
            type: this.type,
            label: this.label,
            helpText: this.helpText,
            validators: this.validators.map(v => v.toDto()),
            value: this.value.toDto(),
            extra: this.extra
        };
    }

    populate(dto: Partial<FunnelFieldDefinitionModelDto<TValue>>) {
        this.fieldId = dto.fieldId || this.fieldId;
        this.stepId = dto.stepId || this.stepId;
        this.type = dto.type || this.type;
        this.label = dto.label || this.label;
        this.helpText = dto.helpText || this.helpText;
        this.validators = dto.validators?.map(validatorFromDto) ?? this.validators;

        if (dto.value) {
            this.value = FunnelFieldValueModel.fromDto<TValue>(dto.value);
        }
        this.extra = (dto.extra ?? this.extra) as TExtra;
    }

    getChecksum(): string {
        return createObjectHash(this.toDto());
    }

    clone() {
        return FunnelFieldDefinitionModel.fromDto(this.toDto());
    }

    static fromDto(dto: FunnelFieldDefinitionModelDto): FunnelFieldDefinitionModel {
        // Could not import the module directly because of circular dependency.
        return require("./fields/fieldFactory").fieldFromDto(dto);
    }
}

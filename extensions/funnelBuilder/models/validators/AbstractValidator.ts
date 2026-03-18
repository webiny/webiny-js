import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

export type FieldValidatorParams<TExtra = Record<string, any>> = {
    errorMessage: string; // Error message to be displayed when validation fails.
    extra: TExtra;
};

export type FieldValidatorParamsDto<TExtra = Record<string, any>> = Partial<
    FieldValidatorParams<TExtra>
>;

export interface FieldValidatorDto<TExtraParams = Record<string, any>> {
    type: string;
    params: FieldValidatorParamsDto<TExtraParams>; // Additional parameters for the validator.
}

export abstract class AbstractValidator<TExtraParams = Record<string, any>> {
    static type = "";

    type: string;
    params: FieldValidatorParams<TExtraParams>;

    constructor(dto: FieldValidatorDto) {
        this.type = dto.type;
        this.params = {
            errorMessage: dto.params?.errorMessage || "Invalid value.",
            extra: (dto.params?.extra || {}) as TExtraParams
        };
    }

    getErrorMessage() {
        return this.params.errorMessage;
    }

    toDto(): FieldValidatorDto<TExtraParams> {
        return { type: this.type, params: this.params };
    }

    async validate(value: any): Promise<void> {
        const isValid = await this.isValid(value);
        if (!isValid) {
            throw new Error(this.getErrorMessage());
        }
    }

    abstract isValid(value: FunnelFieldValueModel): boolean | Promise<boolean>;
}

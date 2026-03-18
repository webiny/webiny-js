import { validation } from "@webiny/validation";
import { AbstractValidator, FieldValidatorParamsDto } from "./AbstractValidator";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

interface MinLengthValidatorExtraParams {
    threshold?: number;
}

export class MinLengthValidator extends AbstractValidator<MinLengthValidatorExtraParams> {
    static override type = "minLength";

    constructor(params: FieldValidatorParamsDto<MinLengthValidatorExtraParams> = {}) {
        super({
            type: "minLength",
            params: {
                errorMessage: params.errorMessage || "Value is too short.",
                extra: {
                    threshold: params.extra?.threshold
                }
            }
        });
    }

    isValid(value: FunnelFieldValueModel) {
        if (value.isEmpty()) {
            return true;
        }

        // Array values are not supported by this validator (can be expanded later if needed).
        if (value.array) {
            return true;
        }

        if (!this.params.extra?.threshold) {
            return true;
        }

        const validators = `minLength:${this.params.extra.threshold}`;
        return validation.validateSync(value.value, validators, { throw: false }) === true;
    }
}

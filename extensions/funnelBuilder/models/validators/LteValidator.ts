import { validation } from "@webiny/validation";
import { AbstractValidator, FieldValidatorParamsDto } from "./AbstractValidator";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

interface LteValidatorExtraParams {
    threshold?: number;
}

export class LteValidator extends AbstractValidator<LteValidatorExtraParams> {
    static override type = "lte";

    constructor(params: FieldValidatorParamsDto<LteValidatorExtraParams> = {}) {
        super({
            type: "lte",
            params: {
                errorMessage: params.errorMessage || "Value is too great.",
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

        const validators = `lte:${this.params.extra.threshold}`;
        return validation.validateSync(value.value, validators, { throw: false }) === true;
    }
}

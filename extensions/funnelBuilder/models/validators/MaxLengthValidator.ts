import { AbstractValidator, FieldValidatorParamsDto } from "./AbstractValidator";
import { maxLength } from "../../utils/validators";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

interface MaxLengthValidatorExtraParams {
    threshold?: number;
}

export class MaxLengthValidator extends AbstractValidator<MaxLengthValidatorExtraParams> {
    static override type = "maxLength";

    constructor(params: FieldValidatorParamsDto<MaxLengthValidatorExtraParams> = {}) {
        super({
            type: "maxLength",
            params: {
                errorMessage: params.errorMessage || "Value is too long.",
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

        return maxLength(String(value.value), this.params.extra.threshold);
    }
}

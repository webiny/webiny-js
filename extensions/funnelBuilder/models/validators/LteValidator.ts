import { AbstractValidator, FieldValidatorParamsDto } from "./AbstractValidator";
import { lte } from "../../utils/validators";
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

        return lte(Number(value.value), this.params.extra.threshold);
    }
}

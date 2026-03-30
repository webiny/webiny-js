import { AbstractValidator, FieldValidatorParamsDto } from "./AbstractValidator";
import { gte } from "../../utils/validators";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

interface GteValidatorExtraParams {
    threshold?: number;
}

export class GteValidator extends AbstractValidator<GteValidatorExtraParams> {
    static override type = "gte";

    constructor(dto: FieldValidatorParamsDto<GteValidatorExtraParams> = {}) {
        super({
            type: "gte",
            params: {
                errorMessage: dto.errorMessage || "Value is too small.",
                extra: {
                    threshold: dto.extra?.threshold
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

        return gte(Number(value.value), this.params.extra.threshold);
    }
}

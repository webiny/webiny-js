import { AbstractValidator, FieldValidatorParamsDto } from "./AbstractValidator";
import { patternPresets } from "./PatternValidator/patternPresets";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

interface PatternValidatorExtraParams {
    preset?: string;
    regex?: string;
    flags?: string;
}

export class PatternValidator extends AbstractValidator<PatternValidatorExtraParams> {
    static override type = "pattern";

    constructor(params: FieldValidatorParamsDto<PatternValidatorExtraParams> = {}) {
        super({
            type: "pattern",
            params: {
                errorMessage: params.errorMessage || "Invalid value.",
                extra: params.extra || {
                    preset: "custom",
                    regex: "",
                    flags: ""
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

        const params = this.params;

        let pattern: Pick<PatternValidatorExtraParams, "regex" | "flags"> | undefined = undefined;
        if (params.extra.preset === "custom") {
            pattern = params.extra;
        } else {
            const patternPreset = patternPresets.find(item => item.type === params.extra.preset);
            if (patternPreset) {
                pattern = patternPreset;
            }
        }

        if (!pattern || !pattern.regex) {
            return true;
        }

        return new RegExp(pattern.regex, pattern.flags).test(String(value.value));
    }
}

import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import { CmsModelFieldPatternValidatorRegistry } from "../abstractions/CmsModelFieldPatternValidatorRegistry.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class PatternValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "pattern";

    public constructor(
        private readonly patternRegistry: CmsModelFieldPatternValidatorRegistry.Interface
    ) {}

    public async validate({ value, validator }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        if (typeof value !== "string" || !value) {
            return true;
        }

        const { settings } = validator;

        let pattern;
        if (settings?.preset === "custom") {
            pattern = settings;
        } else if (settings?.preset) {
            const patternValidator = this.patternRegistry.get(settings.preset);
            if (patternValidator) {
                pattern = patternValidator.pattern;
            }
        }

        if (!pattern) {
            return true;
        }

        return new RegExp(pattern.regex, pattern.flags).test(value);
    }
}

export const PatternValidator = CmsModelFieldValidator.createImplementation({
    implementation: PatternValidatorImpl,
    dependencies: [CmsModelFieldPatternValidatorRegistry]
});

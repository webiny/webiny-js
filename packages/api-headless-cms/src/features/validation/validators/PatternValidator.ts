import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";
import type { CmsModelFieldPatternValidatorPlugin } from "~/types/plugins.js";

class PatternValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "pattern";

    public async validate({
        value,
        validator,
        context
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        if (typeof value !== "string" || !value) {
            return true;
        }

        const { settings } = validator;

        let pattern;
        if (settings?.preset === "custom") {
            pattern = settings;
        } else {
            const patternPlugin = context.plugins
                .byType<CmsModelFieldPatternValidatorPlugin>("cms-model-field-validator-pattern")
                .find(item => item.pattern.name === settings?.preset);

            if (patternPlugin) {
                pattern = patternPlugin.pattern;
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
    dependencies: []
});

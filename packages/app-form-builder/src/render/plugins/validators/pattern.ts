import { plugins } from "@webiny/plugins";
import { FbFormFieldPatternValidatorPlugin, FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "fb-form-field-validator-pattern",
    validator: {
        name: "pattern",
        validate: async (value, validator) => {
            if (!value) {
                return true;
            }

            const { settings } = validator;

            let pattern;
            if (settings.preset === "custom") {
                pattern = settings;
            } else {
                const patternPlugin = plugins
                    .byType<FbFormFieldPatternValidatorPlugin>("fb-form-field-validator-pattern")
                    .find(item => item.pattern.name === settings.preset);
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
};
export default plugin;

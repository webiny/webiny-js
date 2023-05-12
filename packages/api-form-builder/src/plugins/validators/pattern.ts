/**
 * Since form-field-validator plugin needs access to the request context, we create a context plugin which
 * registers the actual validation plugin with access to the request context.
 */
import { FbFormFieldPatternValidatorPlugin, FbFormFieldValidatorPlugin } from "~/types";
import { ContextPlugin } from "@webiny/api";

const plugin = new ContextPlugin(async context => {
    const validatorPlugin: FbFormFieldValidatorPlugin = {
        type: "fb-form-field-validator",
        name: "fb-form-field-validator-pattern",
        validator: {
            name: "pattern",
            validate: async (value: string, validator) => {
                if (!value) {
                    return true;
                }

                const { settings } = validator;

                let pattern: FbFormFieldPatternValidatorPlugin["pattern"] | undefined = undefined;
                if (settings.preset === "custom") {
                    pattern = settings as FbFormFieldPatternValidatorPlugin["pattern"];
                } else {
                    const patternPlugin = context.plugins
                        .byType<FbFormFieldPatternValidatorPlugin>(
                            "fb-form-field-validator-pattern"
                        )
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
    context.plugins.register(validatorPlugin);
});
plugin.name = "context-form-field-validator";

export default plugin;

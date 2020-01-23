/**
 * Since form-field-validator plugin needs access to the request context, we create a context plugin which
 * registers the actual validation plugin with access to the request context.
 */
import { GraphQLContextPlugin } from "@webiny/api/types";
import { FbFormFieldPatternValidatorPlugin } from "@webiny/api-form-builder/types";

export default {
    name: "graphql-context-form-field-validator",
    type: "graphql-context",
    apply(context) {
        context.plugins.register({
            type: "form-field-validator",
            name: "form-field-validator-pattern",
            validator: {
                name: "pattern",
                validate: (value, validator) => {
                    if (!value) {
                        return true;
                    }

                    const { settings } = validator;

                    let pattern;
                    if (settings.preset === "custom") {
                        pattern = settings;
                    } else {
                        const patternPlugin = context.plugins
                            .byType<FbFormFieldPatternValidatorPlugin>(
                                "form-field-validator-pattern"
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
        });
    }
} as GraphQLContextPlugin;

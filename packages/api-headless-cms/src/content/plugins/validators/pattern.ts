import {
    CmsModelFieldPatternValidatorPlugin,
    CmsModelFieldValidatorPlugin
} from "@webiny/api-headless-cms/types";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-pattern",
    validator: {
        name: "pattern",
        async validate({ value, validator, context }) {
            if (!value) {
                return true;
            }

            const { settings } = validator;

            let pattern;
            if (settings.preset === "custom") {
                pattern = settings;
            } else {
                const patternPlugin = context.plugins
                    .byType<CmsModelFieldPatternValidatorPlugin>(
                        "cms-model-field-validator-pattern"
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

export default plugin;

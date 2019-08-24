import { getPlugins } from "@webiny/plugins";

export default {
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
                const patternPlugin = getPlugins("form-field-validator-pattern").find(
                    item => item.pattern.name === settings.preset
                );
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

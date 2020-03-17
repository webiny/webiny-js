import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "@webiny/api-headless-cms/types";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-in",
    validator: {
        name: "in",
        validate({ value, validator }) {
            const values = validator.settings.values;
            if (Array.isArray(values)) {
                return validation
                    .validate(value, `in:${values.join(":")}`)
                    .then(v => v === true)
                    .catch(() => false);
            }

            return Promise.resolve(true);
        }
    }
};

export default plugin;

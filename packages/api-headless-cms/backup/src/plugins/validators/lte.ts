import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "@webiny/api-headless-cms/types";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-lte",
    validator: {
        name: "lte",
        validate({ value, validator }) {
            const lteValue = validator.settings.value;
            if (typeof lteValue !== "undefined") {
                return validation
                    .validate(value, `lte:${lteValue}`)
                    .then(v => v === true)
                    .catch(() => false);
            }
            return Promise.resolve(true);
        }
    }
};

export default plugin;

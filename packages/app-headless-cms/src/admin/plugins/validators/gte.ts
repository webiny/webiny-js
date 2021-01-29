import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-gte",
    validator: {
        name: "gte",
        validate: (value, validator) => {
            const gteValue = validator.settings.value;
            if (typeof gteValue !== "undefined") {
                return validation.validate(value, `gte:${gteValue}`);
            }
        }
    }
} as CmsModelFieldValidatorPlugin;

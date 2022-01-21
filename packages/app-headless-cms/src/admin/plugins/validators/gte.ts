import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export default {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-gte",
    validator: {
        name: "gte",
        validate: async (value, validator) => {
            const gteValue = validator.settings.value;
            if (typeof gteValue === "undefined") {
                return true;
            }
            return validation.validate(value, `gte:${gteValue}`);
        }
    }
} as CmsModelFieldValidatorPlugin;

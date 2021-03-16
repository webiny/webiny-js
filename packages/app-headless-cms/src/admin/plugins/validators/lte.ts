import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export default {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-lte",
    validator: {
        name: "lte",
        validate: (value, validator) => {
            const lteValue = validator.settings.value;
            if (typeof lteValue !== "undefined") {
                return validation.validate(value, `lte:${lteValue}`);
            }
        }
    }
} as CmsModelFieldValidatorPlugin;

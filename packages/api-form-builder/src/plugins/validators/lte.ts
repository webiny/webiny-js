import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

export default {
    type: "fb-form-field-validator",
    name: "form-field-validator-lte",
    validator: {
        name: "lte",
        validate: (value, validator) => {
            const lteValue = validator.settings.value;
            if (typeof lteValue !== "undefined") {
                return validation.validate(value, `lte:${lteValue}`);
            }
        }
    }
} as FbFormFieldValidatorPlugin;

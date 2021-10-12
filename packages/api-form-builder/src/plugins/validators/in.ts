import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

export default {
    type: "fb-form-field-validator",
    name: "form-field-validator-in",
    validator: {
        name: "in",
        validate: (value, validator) => {
            const values = validator.settings.values;
            if (Array.isArray(values)) {
                return validation.validate(value, `in:${values.join(":")}`);
            }
        }
    }
} as FbFormFieldValidatorPlugin;

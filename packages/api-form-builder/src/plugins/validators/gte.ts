import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

export default {
    type: "fb-form-field-validator",
    name: "form-field-validator-gte",
    validator: {
        name: "gte",
        validate: (value, validator) => {
            const gteValue = validator.settings.value;
            if (typeof gteValue === "undefined") {
                return true;
            }
            return validation.validate(value, `gte:${gteValue}`);
        }
    }
} as FbFormFieldValidatorPlugin;

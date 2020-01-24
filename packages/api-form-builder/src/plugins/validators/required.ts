import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "@webiny/api-form-builder/types";

export default {
    type: "form-field-validator",
    name: "form-field-validator-required",
    validator: {
        name: "required",
        validate: value => {
            return validation.validate(value, "required");
        }
    }
} as FbFormFieldValidatorPlugin;

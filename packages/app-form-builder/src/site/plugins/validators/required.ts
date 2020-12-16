import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "@webiny/app-form-builder/types";

export default {
    type: "fb-form-field-validator",
    name: "fb-form-field-validator-required",
    validator: {
        name: "required",
        validate: value => {
            return validation.validate(value, "required");
        }
    }
} as FbFormFieldValidatorPlugin;

import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

export default {
    type: "fb-form-field-validator",
    name: "form-field-validator-required",
    validator: {
        name: "required",
        validate: value => {
            return validation.validate(value, "required");
        }
    }
} as FbFormFieldValidatorPlugin;

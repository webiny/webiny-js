import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-required",
    validator: {
        name: "required",
        validate: (value: string) => {
            return validation.validate(value, "required");
        }
    }
};
export default plugin;

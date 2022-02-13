import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-min-length",
    validator: {
        name: "minLength",
        validate: async (value, validator) => {
            const minLengthValue = validator.settings.value;
            if (typeof minLengthValue === "undefined") {
                return true;
            }
            return validation.validate(value, `minLength:${minLengthValue}`);
        }
    }
};
export default plugin;

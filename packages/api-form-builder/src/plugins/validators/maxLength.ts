import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-max-length",
    validator: {
        name: "maxLength",
        validate: async (value, validator) => {
            const maxLengthValue = validator.settings.value;
            if (typeof maxLengthValue === "undefined") {
                return true;
            }
            return validation.validate(value, `maxLength:${maxLengthValue}`);
        }
    }
};
export default plugin;

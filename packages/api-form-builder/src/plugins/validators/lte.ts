import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-lte",
    validator: {
        name: "lte",
        validate: async (value, validator) => {
            const lteValue = validator.settings.value;
            if (typeof lteValue === "undefined") {
                return true;
            }
            return validation.validate(value, `lte:${lteValue}`);
        }
    }
};
export default plugin;

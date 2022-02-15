import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-gte",
    validator: {
        name: "gte",
        validate: async (value, validator) => {
            const gteValue = validator.settings.value;
            if (typeof gteValue === "undefined") {
                return true;
            }
            return validation.validate(value, `gte:${gteValue}`);
        }
    }
};
export default plugin;

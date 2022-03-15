import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-in",
    validator: {
        name: "in",
        validate: async (value, validator) => {
            const values = validator.settings.values;
            if (!values || Array.isArray(values) === false || values.length === 0) {
                return true;
            }
            return validation.validate(value, `in:${values.join(":")}`);
        }
    }
};
export default plugin;

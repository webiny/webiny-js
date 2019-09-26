import { validation } from "@webiny/validation";

export default {
    type: "form-field-validator",
    name: "form-field-validator-required",
    validator: {
        name: "required",
        validate: (value) => {
            return validation.validate(value, "required")
        }
    }
};

import { validation } from "webiny-validation";

export default {
    type: "form-field-validator",
    name: "form-field-validator-gte",
    validator: {
        name: "gte",
        validate: (value, validator) => {
            const gteValue = validator.settings.value;
            if (typeof gteValue !== "undefined") {
                return validation.validate(value, `gte:${gteValue}`);
            }
        }
    }
};

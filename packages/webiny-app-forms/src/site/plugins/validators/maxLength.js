import { validation } from "webiny-validation";

export default {
    type: "form-field-validator",
    name: "form-field-validator-max-length",
    validator: {
        name: "maxLength",
        validate: (value, validator) => {
            const maxLengthValue = validator.settings.value;
            if (typeof maxLengthValue !== "undefined") {
                return validation.validate(value, `maxLength:${maxLengthValue}`);
            }
        }
    }
};

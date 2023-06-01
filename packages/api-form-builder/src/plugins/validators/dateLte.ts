import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-date-lte",
    validator: {
        name: "dateLte",
        validate: async (value, validator) => {
            // With this regex we check whether our value is time (11:59) and not a date
            // We need this regex in order to apply correct validation rule (example: #line 23)
            // Because for date and time validation rules are different (check @webiny/validation)
            const timeValidator = /(^\d*:\d*)/gm;

            const validValue = `${validator.settings.value}${
                validator.settings.timeZone ? validator.settings.timeZone : ""
            }`;

            if (!value.length) {
                return true;
            }

            if (value.match(timeValidator) !== null) {
                return validation.validate(value, `timeLte:${validValue}`);
            }

            return validation.validate(value, `dateLte:${validValue}`);
        }
    }
};
export default plugin;

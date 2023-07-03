import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-date-time-lte",
    validator: {
        name: "dateLte",
        validate: async (value, validator) => {
            // We need this check because Date and Time values are being stored in the "settings.value".
            // And the value of the Timezone in the "settings.timeZone".
            // So to make validators work we need to merge "settings.value" and "settings.timeZone".
            const validValue = `${validator.settings.value}${
                validator.settings.timeZone ? validator.settings.timeZone : ""
            }`;

            if (!value.length) {
                return true;
            }

            // With this regex we check whether our value is time (11:59) and not a date.
            // We need it in order to apply correct validation rule (example: #line 23).
            // Because for date and time validation rules are different (check @webiny/validation).
            const timeValidator = /(^\d*:\d*)/gm;

            if (value.match(timeValidator) !== null) {
                return validation.validate(value, `timeLte:${validValue}`);
            }

            return validation.validate(value, `dateLte:${validValue}`);
        }
    }
};
export default plugin;

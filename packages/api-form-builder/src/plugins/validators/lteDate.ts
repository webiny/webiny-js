import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-lte-date",
    validator: {
        name: "lteDate",
        validate: async (value, validator) => {
            const regex = /(^\d*:\d*)/gm;

            const validValue = `${validator.settings.value}${
                validator.settings.timeZone ? validator.settings.timeZone : ""
            }`;

            if (!value.length) {
                return true;
            }

            if (value.match(regex) !== null) {
                return validation.validate(value, `timeLte:${validValue}`);
            }

            return validation.validate(value, `dateLte:${validValue}`);
        }
    }
};
export default plugin;

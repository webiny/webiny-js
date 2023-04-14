import { validation } from "@webiny/validation";
import { FbFormFieldValidatorPlugin } from "~/types";

const plugin: FbFormFieldValidatorPlugin = {
    type: "fb-form-field-validator",
    name: "form-field-validator-gte-date",
    validator: {
        name: "gteDate",
        validate: async (value, validator) => {
            const regex = /(^\d*:\d*)/gm;

            const validValue = `${validator.settings.value}${
                validator.settings.timeZone ? validator.settings.timeZone : ""
            }`;

            if (!value.length) {
                return true;
            }

            if (value.match(regex) !== null) {
                return validation.validate(value, `timeGte:${validValue}`);
            }

            return validation.validate(value, `dateGte:${validValue}`);
        }
    }
};
export default plugin;

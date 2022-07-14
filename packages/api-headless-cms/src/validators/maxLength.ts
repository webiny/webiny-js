import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createMaxLengthValidator = (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-max-length",
        validator: {
            name: "maxLength",
            validate({ value, validator }) {
                const maxLengthValue = validator.settings?.value;
                if (typeof maxLengthValue !== "undefined") {
                    return validation
                        .validate(value, `maxLength:${maxLengthValue}`)
                        .then(v => v === true)
                        .catch(() => false);
                }

                return Promise.resolve(true);
            }
        }
    };
};

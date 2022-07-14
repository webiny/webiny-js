import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createMinLengthValidator = (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-min-length",
        validator: {
            name: "minLength",
            validate({ value, validator }) {
                const minLengthValue = validator.settings?.value;
                if (typeof minLengthValue !== "undefined") {
                    return validation
                        .validate(value, `minLength:${minLengthValue}`)
                        .then(v => v === true)
                        .catch(() => false);
                }

                return Promise.resolve(true);
            }
        }
    };
};

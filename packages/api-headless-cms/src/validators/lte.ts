import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createLteValidator = (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-lte",
        validator: {
            name: "lte",
            validate({ value, validator }) {
                const lteValue = validator.settings?.value;
                if (typeof lteValue !== "undefined") {
                    return validation
                        .validate(value, `lte:${lteValue}`)
                        .then(v => v === true)
                        .catch(() => false);
                }
                return Promise.resolve(true);
            }
        }
    };
};

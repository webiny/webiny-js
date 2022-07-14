import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createGteValidator = (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-gte",
        validator: {
            name: "gte",
            validate({ value, validator }) {
                const gteValue = validator.settings?.value;
                if (typeof gteValue !== "undefined") {
                    return validation
                        .validate(value, `gte:${gteValue}`)
                        .then(v => v === true)
                        .catch(() => false);
                }
                return Promise.resolve(true);
            }
        }
    };
};

import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createDateLteValidator = (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-date-lte",
    validator: {
        name: "dateLte",
        async validate({ value, validator }) {
            const { value: lteValue, type } = validator.settings || {};
            if (typeof lteValue === "undefined") {
                return true;
            } else if (type === "time") {
                return validation
                    .validate(value, `timeLte:${lteValue}`)
                    .then(v => v === true)
                    .catch(() => false);
            }
            return validation
                .validate(value, `dateLte:${lteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
    }
});

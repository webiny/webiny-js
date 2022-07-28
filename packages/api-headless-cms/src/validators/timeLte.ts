import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createTimeLteValidator = (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-time-lte",
    validator: {
        name: "timeLte",
        async validate({ value, validator }) {
            const lteValue = validator.settings?.value;
            if (typeof lteValue === "undefined") {
                return true;
            }
            return validation
                .validate(value, `timeLte:${lteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
    }
});

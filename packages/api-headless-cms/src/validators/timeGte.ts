import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createTimeGteValidator = (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-time-gte",
    validator: {
        name: "timeGte",
        async validate({ value, validator }) {
            const gteValue = validator.settings?.value;
            if (typeof gteValue === "undefined") {
                return true;
            }
            return validation
                .validate(value, `timeGte:${gteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
    }
});

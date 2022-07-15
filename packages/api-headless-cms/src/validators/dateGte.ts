import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createDateGteValidator = (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-date-gte",
    validator: {
        name: "dateGte",
        async validate({ value, validator }) {
            const { value: gteValue, type } = validator.settings || {};
            if (typeof gteValue === "undefined") {
                return true;
            } else if (type === "time") {
                return validation
                    .validate(value, `timeGte:${gteValue}`)
                    .then(v => v === true)
                    .catch(() => false);
            }
            return validation
                .validate(value, `dateGte:${gteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
    }
});

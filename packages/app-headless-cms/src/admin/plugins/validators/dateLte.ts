import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export default (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-date-lte",
    validator: {
        name: "dateLte",
        validate: (value, validator) => {
            const { value: lteValue, type } = validator.settings;
            if (typeof lteValue === "undefined") {
                return;
            } else if (type === "time") {
                return validation.validate(value, `timeLte:${lteValue}`);
            }
            return validation.validate(value, `dateLte:${lteValue}`);
        }
    }
});

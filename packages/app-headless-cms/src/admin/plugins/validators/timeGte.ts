import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export default (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-time-gte",
    validator: {
        name: "timeGte",
        validate: async (value, validator) => {
            const gteValue = validator.settings.value;
            if (typeof gteValue === "undefined") {
                return true;
            }
            return validation.validate(value, `timeGte:${gteValue}`);
        }
    }
});

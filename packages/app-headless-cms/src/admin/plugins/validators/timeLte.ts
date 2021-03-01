import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "../../../types";

export default (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-time-lte",
    validator: {
        name: "timeLte",
        validate: (value, validator) => {
            const lteValue = validator.settings.value;
            if (typeof lteValue === "undefined") {
                return;
            }
            return validation.validate(value, `timeLte:${lteValue}`);
        }
    }
});

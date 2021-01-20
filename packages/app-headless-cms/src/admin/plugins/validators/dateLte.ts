import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "@webiny/app-headless-cms/types";

export default (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-date-lte",
    validator: {
        name: "dateLte",
        validate: (value, validator) => {
            const lteValue = validator.settings.value;
            if (typeof lteValue === "undefined") {
                return;
            }
            return validation.validate(value, `dateLte:${lteValue}`);
        }
    }
});

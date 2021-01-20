import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-date-lte",
    validator: {
        name: "dateLte",
        async validate({ value, validator }) {
            const lteValue = validator.settings.value;
            if (typeof lteValue === "undefined") {
                return true;
            }
            return validation
                .validate(value, `dateLte:${lteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
    }
});

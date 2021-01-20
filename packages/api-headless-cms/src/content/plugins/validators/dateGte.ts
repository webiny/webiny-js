import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldValidatorPlugin => ({
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-date-gte",
    validator: {
        name: "dateGte",
        async validate({ value, validator }) {
            const gteValue = validator.settings.value;
            if (typeof gteValue === "undefined") {
                return true;
            }
            return validation
                .validate(value, `dateGte:${gteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
    }
});

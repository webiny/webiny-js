import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "../../../types";

export default {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-in",
    validator: {
        name: "in",
        validate: (value, validator) => {
            const values = validator.settings.values;
            if (Array.isArray(values)) {
                return validation.validate(value, `in:${values.join(":")}`);
            }
        }
    }
} as CmsModelFieldValidatorPlugin;

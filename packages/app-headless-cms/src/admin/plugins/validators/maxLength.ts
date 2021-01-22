import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-max-length",
    validator: {
        name: "maxLength",
        validate: (value, validator) => {
            const maxLengthValue = validator.settings.value;
            if (typeof maxLengthValue !== "undefined") {
                return validation.validate(value, `maxLength:${maxLengthValue}`);
            }
        }
    }
} as CmsModelFieldValidatorPlugin;

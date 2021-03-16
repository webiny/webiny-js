import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export default {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-min-length",
    validator: {
        name: "minLength",
        validate: (value, validator) => {
            const minLengthValue = validator.settings.value;
            if (typeof minLengthValue !== "undefined") {
                return validation.validate(value, `minLength:${minLengthValue}`);
            }
        }
    }
} as CmsModelFieldValidatorPlugin;

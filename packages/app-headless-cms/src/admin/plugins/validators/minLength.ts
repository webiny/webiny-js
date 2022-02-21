import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-min-length",
    validator: {
        name: "minLength",
        validate: async (value, validator) => {
            const minLengthValue = validator.settings.value;
            if (typeof minLengthValue === "undefined") {
                return true;
            }
            return validation.validate(value, `minLength:${minLengthValue}`);
        }
    }
};

export default plugin;

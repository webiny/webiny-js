import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-lte",
    validator: {
        name: "lte",
        validate: async (value, validator) => {
            const lteValue = validator.settings.value;
            if (typeof lteValue === "undefined") {
                return true;
            }
            return validation.validate(value, `lte:${lteValue}`);
        }
    }
};
export default plugin;

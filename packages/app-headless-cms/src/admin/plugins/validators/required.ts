import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "../../../types";

export default {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-required",
    validator: {
        name: "required",
        validate: value => {
            return validation.validate(value, "required");
        }
    }
} as CmsModelFieldValidatorPlugin;

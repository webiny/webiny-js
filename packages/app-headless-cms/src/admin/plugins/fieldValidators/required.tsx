import { CmsModelFieldValidatorPlugin } from "~/types";
import { validation } from "@webiny/validation";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-required",
    validator: {
        name: "required",
        label: "Required",
        description: "You won't be able to submit the form if this field is empty",
        defaultMessage: "Value is required.",
        validate: value => {
            return validation.validate(value, "required");
        }
    }
};
export default plugin;

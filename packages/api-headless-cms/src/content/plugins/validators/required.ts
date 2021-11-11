import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-required",
    validator: {
        name: "required",
        validate({ value }) {
            return validation
                .validate(value, "required")
                .then(v => v === true)
                .catch(() => false);
        }
    }
};

export default plugin;

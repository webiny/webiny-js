import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

export const createRequiredValidator = (): CmsModelFieldValidatorPlugin => {
    return {
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
};

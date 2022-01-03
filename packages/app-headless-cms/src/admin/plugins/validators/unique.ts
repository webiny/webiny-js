import { CmsModelFieldValidatorPlugin } from "~/types";
import { validation } from "@webiny/validation";
import ValidationError from "@webiny/validation/validationError";

/**
 * In the UI we will pretend that field is unique.
 * When saving the entry, API call will check for the uniqueness.
 */
export default (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-unique",
        validator: {
            name: "unique",
            validate: async value => {
                try {
                    await validation.validate(value, "required");
                } catch (ex) {
                    throw new ValidationError("Value cannot be empty.", "unique", value);
                }
                return true;
            }
        }
    };
};

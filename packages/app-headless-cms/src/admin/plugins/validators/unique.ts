import { CmsModelFieldValidatorPlugin } from "~/types";

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
            validate: async () => {
                return true;
            }
        }
    };
};

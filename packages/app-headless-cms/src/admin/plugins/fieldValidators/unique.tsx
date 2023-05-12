import { CmsModelFieldValidatorPlugin } from "~/types";

export default (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-editor-field-validator-unique",
        validator: {
            name: "unique",
            label: "Unique",
            description: "You won't be able to submit the form if this field is not unique",
            defaultMessage: "Value must be unique.",
            validate: async () => {
                /**
                 * We let this validator be executed on the API side.
                 */
                return true;
            }
        }
    };
};

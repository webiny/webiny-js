import { CmsEditorFieldValidatorPlugin } from "~/types";

export default (): CmsEditorFieldValidatorPlugin => {
    return {
        type: "cms-editor-field-validator",
        name: "cms-editor-field-validator-unique",
        validator: {
            name: "unique",
            label: "Unique",
            description: "You won't be able to submit the form if this field is not unique",
            defaultMessage: "Value must be unique."
        }
    };
};

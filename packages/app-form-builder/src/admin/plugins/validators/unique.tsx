import { FbBuilderFormFieldValidatorPlugin } from "@webiny/app-form-builder/types";

export default {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-unique",
    validator: {
        name: "unique",
        label: "Unique",
        description: "You won't be able to submit the form if the field value is not unique",
        defaultMessage: "Unique value is required."
    }
} as FbBuilderFormFieldValidatorPlugin;

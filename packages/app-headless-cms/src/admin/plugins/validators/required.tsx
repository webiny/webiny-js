import { CmsBuilderFormFieldValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "content-model-editor-field-validator",
    name: "content-model-editor-field-validator-required",
    validator: {
        name: "required",
        label: "Required",
        description: "You won't be able to submit the form if this field is empty",
        defaultMessage: "Value is required."
    }
} as CmsBuilderFormFieldValidatorPlugin;

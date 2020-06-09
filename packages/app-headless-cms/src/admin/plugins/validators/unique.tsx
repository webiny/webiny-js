import { CmsEditorFieldValidatorPlugin } from '@webiny/app-headless-cms/types';

export default {
    type: "cms-editor-field-validator",
    name: "cms-editor-field-validator-unique",
    validator: {
        name: "unique",
        label: "Unique",
        description: "You won't be able to submit the form if the field value is not unique",
        defaultMessage: "Unique value is required."
    }
} as CmsEditorFieldValidatorPlugin;

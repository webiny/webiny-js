import { CmsFormFieldPatternValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "content-model-editor-field-validator-pattern",
    name: "content-model-editor-field-validator-pattern-email",
    pattern: {
        message: "Please enter a valid e-mail.",
        name: "email",
        label: "E-mail"
    }
} as CmsFormFieldPatternValidatorPlugin;

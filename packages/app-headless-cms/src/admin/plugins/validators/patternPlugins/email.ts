import { CmsFormFieldPatternValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-email",
    pattern: {
        message: "Please enter a valid e-mail.",
        name: "email",
        label: "E-mail"
    }
} as CmsFormFieldPatternValidatorPlugin;

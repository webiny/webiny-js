import { CmsFormFieldPatternValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-url",
    pattern: {
        message: "Please enter a valid URL.",
        name: "url",
        label: "URL"
    }
} as CmsFormFieldPatternValidatorPlugin;

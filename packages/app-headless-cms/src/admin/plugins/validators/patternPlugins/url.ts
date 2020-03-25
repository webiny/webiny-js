import { CmsFormFieldPatternValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "content-model-editor-field-validator-pattern",
    name: "content-model-editor-field-validator-pattern-url",
    pattern: {
        message: "Please enter a valid URL.",
        name: "url",
        label: "URL"
    }
} as CmsFormFieldPatternValidatorPlugin;

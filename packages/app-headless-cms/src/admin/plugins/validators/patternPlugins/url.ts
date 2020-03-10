import { FbFormFieldPatternValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "form-editor-field-validator-pattern",
    name: "form-editor-field-validator-pattern-url",
    pattern: {
        message: "Please enter a valid URL.",
        name: "url",
        label: "URL"
    }
} as FbFormFieldPatternValidatorPlugin;

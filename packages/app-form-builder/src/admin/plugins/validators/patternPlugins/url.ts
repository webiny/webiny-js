import { FbFormFieldPatternValidatorPlugin } from "@webiny/app-form-builder/types";

export default {
    type: "form-editor-field-validator-pattern",
    name: "form-editor-field-validator-pattern-url",
    pattern: {
        message: "Please enter a valid URL.",
        name: "url",
        label: "URL"
    }
} as FbFormFieldPatternValidatorPlugin;

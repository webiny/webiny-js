import { FbFormFieldPatternValidatorPlugin } from "../../../../../types";

export default {
    type: "fb-form-field-validator-pattern",
    name: "form-editor-field-validator-pattern-url",
    pattern: {
        message: "Please enter a valid URL.",
        name: "url",
        label: "URL"
    }
} as FbFormFieldPatternValidatorPlugin;

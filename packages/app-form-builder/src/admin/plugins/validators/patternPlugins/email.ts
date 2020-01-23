import { FbFormFieldPatternValidatorPlugin } from "@webiny/app-form-builder/types";

export default {
    type: "form-editor-field-validator-pattern",
    name: "form-editor-field-validator-pattern-email",
    pattern: {
        message: "Please enter a valid e-mail.",
        name: "email",
        label: "E-mail"
    }
} as FbFormFieldPatternValidatorPlugin;

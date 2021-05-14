import { FbFormFieldPatternValidatorPlugin } from "../../../../../types";

export default {
    type: "fb-form-field-validator-pattern",
    name: "form-editor-field-validator-pattern-email",
    pattern: {
        message: "Please enter a valid e-mail.",
        name: "email",
        label: "E-mail"
    }
} as FbFormFieldPatternValidatorPlugin;

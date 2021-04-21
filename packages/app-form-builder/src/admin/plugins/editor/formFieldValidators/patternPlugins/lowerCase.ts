import { FbFormFieldPatternValidatorPlugin } from "../../../../../types";

export default {
    type: "fb-form-field-validator-pattern",
    name: "form-editor-field-validator-pattern-lower-case",
    pattern: {
        message: "Only lower case characters are allowed.",
        name: "lowerCase",
        label: "Lower case"
    }
} as FbFormFieldPatternValidatorPlugin;

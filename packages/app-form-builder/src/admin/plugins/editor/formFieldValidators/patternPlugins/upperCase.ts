import { FbFormFieldPatternValidatorPlugin } from "../../../../../types";

export default {
    type: "fb-form-field-validator-pattern",
    name: "form-editor-field-validator-pattern-upper-case",
    pattern: {
        message: "Only upper case characters are allowed.",
        name: "upperCase",
        label: "Upper case"
    }
} as FbFormFieldPatternValidatorPlugin;

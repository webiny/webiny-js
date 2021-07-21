import { FbFormFieldPatternValidatorPlugin } from "~/types";

export default {
    type: "fb-form-field-validator-pattern",
    name: "form-field-validator-pattern-upper-case",
    pattern: {
        name: "upperCase",
        regex: `^([A-Z]*)$`,
        flags: ""
    }
} as FbFormFieldPatternValidatorPlugin;

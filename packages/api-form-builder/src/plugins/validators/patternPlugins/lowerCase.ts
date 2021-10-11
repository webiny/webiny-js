import { FbFormFieldPatternValidatorPlugin } from "~/types";

export default {
    type: "fb-form-field-validator-pattern",
    name: "form-field-validator-pattern-lower-case",
    pattern: {
        name: "lowerCase",
        regex: `^([a-z]*)$`,
        flags: ""
    }
} as FbFormFieldPatternValidatorPlugin;

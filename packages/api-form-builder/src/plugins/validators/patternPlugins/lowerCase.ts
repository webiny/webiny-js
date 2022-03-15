import { FbFormFieldPatternValidatorPlugin } from "~/types";

const plugin: FbFormFieldPatternValidatorPlugin = {
    type: "fb-form-field-validator-pattern",
    name: "form-field-validator-pattern-lower-case",
    pattern: {
        name: "lowerCase",
        regex: `^([a-z]*)$`,
        flags: ""
    }
};
export default plugin;

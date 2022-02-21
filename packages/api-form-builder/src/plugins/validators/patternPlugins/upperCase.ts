import { FbFormFieldPatternValidatorPlugin } from "~/types";

const plugin: FbFormFieldPatternValidatorPlugin = {
    type: "fb-form-field-validator-pattern",
    name: "form-field-validator-pattern-upper-case",
    pattern: {
        name: "upperCase",
        regex: `^([A-Z]*)$`,
        flags: ""
    }
};
export default plugin;

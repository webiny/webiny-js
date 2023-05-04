import { FbFormFieldPatternValidatorPlugin } from "~/types";

const plugin: FbFormFieldPatternValidatorPlugin = {
    type: "fb-form-field-validator-pattern",
    name: "form-field-validator-pattern-url",
    pattern: {
        name: "url",
        regex: "^((ftp|http|https):\\/\\/)?([a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)+.*)$",
        flags: "i"
    }
};
export default plugin;

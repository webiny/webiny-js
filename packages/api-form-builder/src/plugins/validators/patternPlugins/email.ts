import { FbFormFieldPatternValidatorPlugin } from "~/types";

const plugin: FbFormFieldPatternValidatorPlugin = {
    type: "fb-form-field-validator-pattern",
    name: "form-field-validator-pattern-email",
    pattern: {
        name: "email",
        regex: `^\\w[\\+\\w.-]*@([\\w-]+\\.)+[\\w-]+$`,
        flags: "i"
    }
};
export default plugin;

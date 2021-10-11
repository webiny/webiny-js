import { FbFormFieldPatternValidatorPlugin } from "~/types";

export default {
    type: "fb-form-field-validator-pattern",
    name: "form-field-validator-pattern-email",
    pattern: {
        name: "email",
        regex: `^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$`,
        flags: "i"
    }
} as FbFormFieldPatternValidatorPlugin;

import { FbFormFieldPatternValidatorPlugin } from "../../../types";

export default {
    type: "fb-form-field-validator-pattern",
    name: "form-field-validator-pattern-url",
    pattern: {
        name: "url",
        regex: "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$",
        flags: "i"
    }
} as FbFormFieldPatternValidatorPlugin;

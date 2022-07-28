import { CmsModelFieldPatternValidatorPlugin } from "~/types";

export const createUrlPatternValidator = (): CmsModelFieldPatternValidatorPlugin => {
    return {
        type: "cms-model-field-validator-pattern",
        name: "cms-model-field-validator-pattern-url",
        pattern: {
            name: "url",
            regex: "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$",
            flags: "i"
        }
    };
};

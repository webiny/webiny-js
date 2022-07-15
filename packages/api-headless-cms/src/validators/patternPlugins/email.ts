import { CmsModelFieldPatternValidatorPlugin } from "~/types";

export const createEmailPatternValidator = (): CmsModelFieldPatternValidatorPlugin => {
    return {
        type: "cms-model-field-validator-pattern",
        name: "cms-model-field-validator-pattern-email",
        pattern: {
            name: "email",
            regex: `^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$`,
            flags: "i"
        }
    };
};

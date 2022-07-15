import { CmsModelFieldPatternValidatorPlugin } from "~/types";

export const createLowerCasePatternValidator = (): CmsModelFieldPatternValidatorPlugin => {
    return {
        type: "cms-model-field-validator-pattern",
        name: "cms-model-field-validator-pattern-lower-case",
        pattern: {
            name: "lowerCase",
            regex: `^([a-z]*)$`,
            flags: ""
        }
    };
};

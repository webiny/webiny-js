import { CmsModelFieldPatternValidatorPlugin } from "@webiny/api-headless-cms/types";

const plugin: CmsModelFieldPatternValidatorPlugin = {
    type: "cms-model-field-validator-pattern",
    name: "cms-model-field-validator-pattern-lower-case",
    pattern: {
        name: "lowerCase",
        regex: `^([a-z]*)$`,
        flags: ""
    }
};

export default plugin;

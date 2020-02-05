import { CmsModelFieldPatternValidatorPlugin } from "@webiny/api-headless-cms/types";

const plugin: CmsModelFieldPatternValidatorPlugin = {
    type: "cms-model-field-validator-pattern",
    name: "cms-model-field-validator-pattern-upper-case",
    pattern: {
        name: "upperCase",
        regex: `^([A-Z]*)$`,
        flags: ""
    }
};

export default plugin;

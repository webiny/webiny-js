import { CmsModelFieldPatternValidatorPlugin } from "~/types";

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

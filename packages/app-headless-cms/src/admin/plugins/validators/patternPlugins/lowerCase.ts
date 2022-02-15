import { CmsModelFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPatternPlugin = {
    type: "cms-model-field-validator-pattern",
    name: "cms-model-field-validator-pattern-lower-case",
    pattern: {
        name: "lowerCase",
        regex: `^([a-z]*)$`,
        flags: ""
    }
};

export default plugin;

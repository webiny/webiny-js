import { CmsModelFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPatternPlugin = {
    type: "cms-model-field-validator-pattern",
    name: "cms-model-field-validator-pattern-upper-case",
    pattern: {
        name: "upperCase",
        regex: `^([A-Z]*)$`,
        flags: ""
    }
};
export default plugin;

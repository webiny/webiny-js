import { CmsModelFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPatternPlugin = {
    type: "cms-model-field-validator-pattern",
    name: "cms-model-field-validator-pattern-upper-case-space",
    pattern: {
        name: "upperCaseSpace",
        regex: `^([A-Z\\s]+)$`,
        flags: ""
    }
};

export default plugin;

import { CmsModelFieldPatternValidatorPlugin } from "~/types";

const plugin: CmsModelFieldPatternValidatorPlugin = {
    type: "cms-model-field-validator-pattern",
    name: "cms-model-field-validator-pattern-upper-case-space",
    pattern: {
        name: "upperCaseSpace",
        regex: `^([A-Z\\s]+)$`,
        flags: ""
    }
};

export default plugin;

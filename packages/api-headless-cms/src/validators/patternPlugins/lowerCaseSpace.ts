import { CmsModelFieldPatternValidatorPlugin } from "~/types";

const plugin: CmsModelFieldPatternValidatorPlugin = {
    type: "cms-model-field-validator-pattern",
    name: "cms-model-field-validator-pattern-lower-case-space",
    pattern: {
        name: "lowerCaseSpace",
        regex: `^([a-z\\s]+)$`,
        flags: ""
    }
};

export default plugin;

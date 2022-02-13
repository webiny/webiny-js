import { CmsModelFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPatternPlugin = {
    type: "cms-model-field-validator-pattern",
    name: "cms-model-field-validator-pattern-lower-case-space",
    pattern: {
        name: "lowerCaseSpace",
        regex: `^([a-z\\s]+)$`,
        flags: ""
    }
};
export default plugin;

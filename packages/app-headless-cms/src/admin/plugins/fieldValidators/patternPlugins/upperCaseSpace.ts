import { CmsModelFieldRegexValidatorExpressionPlugin } from "~/types";

const plugin: CmsModelFieldRegexValidatorExpressionPlugin = {
    type: "cms-model-field-regex-validator-expression",
    name: "cms-model-field-regex-validator-expression-upper-case-space",
    pattern: {
        message: "Only upper case characters and space are allowed.",
        name: "upperCaseSpace",
        label: "Upper case + space",
        regex: `^([A-Z\\s]+)$`,
        flags: ""
    }
};
export default plugin;

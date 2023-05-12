import { CmsModelFieldRegexValidatorExpressionPlugin } from "~/types";

const plugin: CmsModelFieldRegexValidatorExpressionPlugin = {
    type: "cms-model-field-regex-validator-expression",
    name: "cms-model-field-regex-validator-expression-upper-case",
    pattern: {
        message: "Only upper case characters are allowed.",
        name: "upperCase",
        label: "Upper case",
        regex: `^([A-Z]*)$`,
        flags: ""
    }
};
export default plugin;

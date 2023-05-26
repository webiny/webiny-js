import { CmsModelFieldRegexValidatorExpressionPlugin } from "~/types";

const plugin: CmsModelFieldRegexValidatorExpressionPlugin = {
    type: "cms-model-field-regex-validator-expression",
    name: "cms-model-field-regex-validator-expression-case",
    pattern: {
        message: "Only lower case characters are allowed.",
        name: "lowerCase",
        label: "Lower case",
        regex: `^([a-z]*)$`,
        flags: ""
    }
};

export default plugin;

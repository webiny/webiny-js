import { CmsModelFieldRegexValidatorExpressionPlugin } from "~/types";

const plugin: CmsModelFieldRegexValidatorExpressionPlugin = {
    type: "cms-model-field-regex-validator-expression",
    name: "cms-model-field-regex-validator-expression-lower-case-space",
    pattern: {
        message: "Only lower case characters and space are allowed.",
        name: "lowerCaseSpace",
        label: "Lower case + space",
        regex: `^([a-z\\s]+)$`,
        flags: ""
    }
};
export default plugin;

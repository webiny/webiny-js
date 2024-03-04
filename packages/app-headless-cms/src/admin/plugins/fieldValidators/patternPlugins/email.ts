import { CmsModelFieldRegexValidatorExpressionPlugin } from "~/types";

const plugin: CmsModelFieldRegexValidatorExpressionPlugin = {
    type: "cms-model-field-regex-validator-expression",
    name: "cms-model-field-regex-validator-expression",
    pattern: {
        name: "email",
        label: "E-mail",
        message: "Please enter a valid e-mail.",
        regex: `^\\w[\\+\\w.-]*@([\\w-]+\\.)+[\\w-]+$`,
        flags: "i"
    }
};
export default plugin;

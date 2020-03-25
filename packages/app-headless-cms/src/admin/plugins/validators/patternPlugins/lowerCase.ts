import { CmsFormFieldPatternValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "content-model-editor-field-validator-pattern",
    name: "content-model-editor-field-validator-pattern-lower-case",
    pattern: {
        message: "Only lower case characters are allowed.",
        name: "lowerCase",
        label: "Lower case"
    }
} as CmsFormFieldPatternValidatorPlugin;

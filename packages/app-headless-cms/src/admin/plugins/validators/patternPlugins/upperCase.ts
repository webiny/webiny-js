import { CmsFormFieldPatternValidatorPlugin } from "@webiny/app-headless-cms/types";

export default {
    type: "content-model-editor-field-validator-pattern",
    name: "content-model-editor-field-validator-pattern-upper-case",
    pattern: {
        message: "Only upper case characters are allowed.",
        name: "upperCase",
        label: "Upper case"
    }
} as CmsFormFieldPatternValidatorPlugin;

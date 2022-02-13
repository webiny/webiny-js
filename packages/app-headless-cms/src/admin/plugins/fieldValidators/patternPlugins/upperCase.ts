import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsEditorFieldValidatorPatternPlugin = {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-upper-case",
    pattern: {
        message: "Only upper case characters are allowed.",
        name: "upperCase",
        label: "Upper case"
    }
};
export default plugin;

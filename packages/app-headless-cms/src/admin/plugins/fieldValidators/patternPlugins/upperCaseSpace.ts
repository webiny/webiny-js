import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsEditorFieldValidatorPatternPlugin = {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-upper-case-space",
    pattern: {
        message: "Only upper case characters and space are allowed.",
        name: "upperCaseSpace",
        label: "Upper case + space"
    }
};
export default plugin;

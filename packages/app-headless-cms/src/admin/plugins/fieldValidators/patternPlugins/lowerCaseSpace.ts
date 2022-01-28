import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsEditorFieldValidatorPatternPlugin = {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-lower-case-space",
    pattern: {
        message: "Only lower case characters and space are allowed.",
        name: "lowerCaseSpace",
        label: "Lower case + space"
    }
};
export default plugin;

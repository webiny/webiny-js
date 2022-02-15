import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsEditorFieldValidatorPatternPlugin = {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-url",
    pattern: {
        message: "Please enter a valid URL.",
        name: "url",
        label: "URL"
    }
};
export default plugin;

import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

const plugin: CmsEditorFieldValidatorPatternPlugin = {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-email",
    pattern: {
        message: "Please enter a valid e-mail.",
        name: "email",
        label: "E-mail"
    }
};
export default plugin;

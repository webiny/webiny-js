import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

export default {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-url",
    pattern: {
        message: "Please enter a valid URL.",
        name: "url",
        label: "URL"
    }
} as CmsEditorFieldValidatorPatternPlugin;

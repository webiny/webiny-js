import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

export default {
    type: "cms-editor-field-validator-pattern",
    name: "cms-editor-field-validator-pattern-lower-case-space",
    pattern: {
        message: "Only lower case characters and space are allowed.",
        name: "lowerCaseSpace",
        label: "Lower case + space"
    }
} as CmsEditorFieldValidatorPatternPlugin;

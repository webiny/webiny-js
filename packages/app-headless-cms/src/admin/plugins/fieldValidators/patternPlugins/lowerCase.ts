import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

export default (): CmsEditorFieldValidatorPatternPlugin => {
    return {
        type: "cms-editor-field-validator-pattern",
        name: "cms-editor-field-validator-pattern-lower-case",
        pattern: {
            message: "Only lower case characters are allowed.",
            name: "lowerCase",
            label: "Lower case"
        }
    };
};

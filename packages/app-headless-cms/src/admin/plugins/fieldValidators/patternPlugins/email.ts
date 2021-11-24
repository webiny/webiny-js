import { CmsEditorFieldValidatorPatternPlugin } from "~/types";

export default (): CmsEditorFieldValidatorPatternPlugin => {
    return {
        type: "cms-editor-field-validator-pattern",
        name: "cms-editor-field-validator-pattern-email",
        pattern: {
            message: "Please enter a valid e-mail.",
            name: "email",
            label: "E-mail"
        }
    };
};

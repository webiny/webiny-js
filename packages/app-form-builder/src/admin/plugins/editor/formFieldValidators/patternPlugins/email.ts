import { FbBuilderFormFieldPatternValidatorPlugin } from "~/types";

const plugin: FbBuilderFormFieldPatternValidatorPlugin = {
    type: "form-editor-field-validator-pattern",
    name: "form-editor-field-validator-pattern-email",
    pattern: {
        message: "Please enter a valid e-mail.",
        name: "email",
        label: "E-mail"
    }
};
export default plugin;

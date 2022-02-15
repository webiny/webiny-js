import { FbBuilderFormFieldPatternValidatorPlugin } from "~/types";

const plugin: FbBuilderFormFieldPatternValidatorPlugin = {
    type: "form-editor-field-validator-pattern",
    name: "form-editor-field-validator-pattern-lower-case",
    pattern: {
        message: "Only lower case characters are allowed.",
        name: "lowerCase",
        label: "Lower case"
    }
};
export default plugin;

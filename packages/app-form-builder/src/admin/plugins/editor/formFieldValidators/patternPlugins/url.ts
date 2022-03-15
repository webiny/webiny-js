import { FbBuilderFormFieldPatternValidatorPlugin } from "~/types";

const plugin: FbBuilderFormFieldPatternValidatorPlugin = {
    type: "form-editor-field-validator-pattern",
    name: "form-editor-field-validator-pattern-url",
    pattern: {
        message: "Please enter a valid URL.",
        name: "url",
        label: "URL"
    }
};
export default plugin;

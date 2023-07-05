import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-heading",
    type: "pb-block-editor-create-variable",
    elementType: "heading",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "heading",
                label: "Heading text",
                value: element.data?.text?.data?.text
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.text?.data?.text;
    }
} as PbBlockEditorCreateVariablePlugin;

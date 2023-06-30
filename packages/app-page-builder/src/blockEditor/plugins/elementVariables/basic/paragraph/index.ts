import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-paragraph",
    type: "pb-block-editor-create-variable",
    elementType: "paragraph",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "paragraph",
                label: "Paragraph text",
                value: element.data?.text?.data?.text
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.text?.data?.text;
    }
} as PbBlockEditorCreateVariablePlugin;

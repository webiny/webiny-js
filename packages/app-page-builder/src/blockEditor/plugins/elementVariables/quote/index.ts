import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-quote",
    type: "pb-block-editor-create-variable",
    elementType: "quote",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "quote",
                label: "Quote",
                value: element.data?.text?.data?.text
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.text?.data?.text;
    }
} as PbBlockEditorCreateVariablePlugin;

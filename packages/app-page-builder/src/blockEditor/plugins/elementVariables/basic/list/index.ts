import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-list",
    type: "pb-block-editor-create-variable",
    elementType: "list",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "list",
                label: "List",
                value: element.data?.text?.data?.text
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.text?.data?.text;
    }
} as PbBlockEditorCreateVariablePlugin;

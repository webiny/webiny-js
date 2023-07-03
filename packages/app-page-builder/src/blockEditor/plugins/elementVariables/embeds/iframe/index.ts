import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-iframe",
    type: "pb-block-editor-create-variable",
    elementType: "iframe",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "iframe",
                label: "iframe URL",
                value: element.data?.iframe?.url
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.iframe?.url;
    }
} as PbBlockEditorCreateVariablePlugin;

import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-youtube",
    type: "pb-block-editor-create-variable",
    elementType: "youtube",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "youtube",
                label: "YouTube video URL",
                value: element.data?.source?.url
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.source?.url;
    }
} as PbBlockEditorCreateVariablePlugin;

import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-vimeo",
    type: "pb-block-editor-create-variable",
    elementType: "vimeo",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "vimeo",
                label: "Vimeo video URL",
                value: element.data?.source?.url
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.source?.url;
    }
} as PbBlockEditorCreateVariablePlugin;

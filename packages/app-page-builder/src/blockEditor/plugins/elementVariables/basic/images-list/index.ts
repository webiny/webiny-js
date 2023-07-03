import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-images-list",
    type: "pb-block-editor-create-variable",
    elementType: "images-list",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "images-list",
                label: "Images list",
                value: element.data?.images
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.images;
    }
} as PbBlockEditorCreateVariablePlugin;

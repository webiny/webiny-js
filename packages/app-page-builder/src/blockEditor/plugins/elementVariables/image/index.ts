import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-image",
    type: "pb-block-editor-create-variable",
    elementType: "image",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "image",
                label: "Image",
                value: element.data?.image?.file
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.image?.file;
    }
} as PbBlockEditorCreateVariablePlugin;

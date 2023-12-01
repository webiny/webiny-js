import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-pinterest",
    type: "pb-block-editor-create-variable",
    elementType: "pinterest",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "pinterest",
                label: "Pinterest URL",
                value: element.data?.source?.url
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.source?.url;
    }
} as PbBlockEditorCreateVariablePlugin;

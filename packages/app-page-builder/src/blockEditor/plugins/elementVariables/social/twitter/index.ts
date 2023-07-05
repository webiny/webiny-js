import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-twitter",
    type: "pb-block-editor-create-variable",
    elementType: "twitter",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "twitter",
                label: "Tweet URL",
                value: element.data?.source?.url
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.source?.url;
    }
} as PbBlockEditorCreateVariablePlugin;

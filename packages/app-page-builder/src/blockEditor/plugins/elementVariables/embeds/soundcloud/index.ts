import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-soundcloud",
    type: "pb-block-editor-create-variable",
    elementType: "soundcloud",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "soundcloud",
                label: "SoundCloud song URL",
                value: element.data?.source?.url
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.source?.url;
    }
} as PbBlockEditorCreateVariablePlugin;

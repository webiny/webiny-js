import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-icon",
    type: "pb-block-editor-create-variable",
    elementType: "icon",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "icon",
                label: "Icon",
                value: element.data?.icon?.value
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.icon?.value;
    }
} as PbBlockEditorCreateVariablePlugin;

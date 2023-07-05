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
                value: { id: element.data?.icon?.id, svg: element.data?.icon?.svg }
            }
        ];
    },
    getVariableValue({ element }) {
        return { id: element.data?.icon?.id, svg: element.data?.icon?.svg };
    }
} as PbBlockEditorCreateVariablePlugin;

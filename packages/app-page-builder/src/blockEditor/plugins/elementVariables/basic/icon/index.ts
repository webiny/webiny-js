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
                // We also store `element?.data.icon?.width` to render
                // correctly sized icon markup on icon variable change.
                value: {
                    ...(element.data?.icon?.value || {}),
                    markupWidth: element?.data.icon?.width
                }
            }
        ];
    },
    getVariableValue({ element }) {
        return {
            ...(element.data?.icon?.value || {}),
            markupWidth: element?.data.icon?.width
        };
    }
} as PbBlockEditorCreateVariablePlugin;

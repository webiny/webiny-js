import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-button",
    type: "pb-block-editor-create-variable",
    elementType: "button",
    createVariables({ element }) {
        return [
            {
                id: `${element.id}.label`,
                type: "button",
                label: "Button label",
                value: element.data?.buttonText
            },
            {
                id: `${element.id}.url`,
                type: "button",
                label: "Button URL",
                value: element.data?.action?.href
            }
        ];
    },
    getVariableValue({ element, variableId }) {
        if (!variableId) {
            return null;
        }
        if (variableId.endsWith(".label")) {
            return element.data?.buttonText;
        }
        if (variableId.endsWith(".url")) {
            return element.data?.action?.href;
        }

        return null;
    }
} as PbBlockEditorCreateVariablePlugin;

import { PbBlockEditorCreateVariablePlugin } from "~/types";

export default {
    name: "pb-block-editor-create-variable-codesandbox",
    type: "pb-block-editor-create-variable",
    elementType: "codesandbox",
    createVariables({ element }) {
        return [
            {
                id: element.id,
                type: "codesandbox",
                label: "CodeSandbox URL",
                value: element.data?.source?.url
            }
        ];
    },
    getVariableValue({ element }) {
        return element.data?.source?.url;
    }
} as PbBlockEditorCreateVariablePlugin;

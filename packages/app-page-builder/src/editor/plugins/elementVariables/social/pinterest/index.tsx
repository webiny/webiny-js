import React from "react";
import { PbEditorPageElementVariableRendererPlugin } from "~/types";
import TextVariableInput from "~/editor/plugins/elementSettings/variable/TextVariableInput";
import { useElementVariables } from "~/editor/hooks/useElementVariableValue";

export default {
    name: "pb-editor-page-element-variable-renderer-pinterest",
    type: "pb-editor-page-element-variable-renderer",
    elementType: "pinterest",
    getVariableValue(element) {
        const variables = useElementVariables(element);
        return variables?.length > 0 ? variables[0].value : null;
    },
    renderVariableInput(variableId: string) {
        return <TextVariableInput variableId={variableId} />;
    },
    setElementValue(element, variables) {
        const newText = variables?.length > 0 ? variables[0].value : null;

        if (newText && element.data?.source?.url) {
            element.data.source.url = newText;
        }

        return element;
    }
} as PbEditorPageElementVariableRendererPlugin;

import React from "react";
import { PbEditorPageElementVariableRendererPlugin } from "~/types";
import LinkVariableInput from "~/editor/plugins/elementSettings/variable/LinkVariableInput";
import { useElementVariables } from "~/editor/hooks/useElementVariableValue";

export default {
    name: "pb-editor-page-element-variable-renderer-youtube",
    type: "pb-editor-page-element-variable-renderer",
    elementType: "youtube",
    getVariableValue(element) {
        const variables = useElementVariables(element);
        return variables.length > 0 ? variables[0].value : null;
    },
    renderVariableInput(variableId: string) {
        return (
            <LinkVariableInput
                variableId={variableId}
                placeholder={"https://youtube.com/watch?v=4qcDLzu8kVM"}
                description={"Enter a video URL"}
            />
        );
    },
    setElementValue(element, variables) {
        const newText = variables?.length > 0 ? variables[0].value : null;

        if (newText && element.data?.source?.url) {
            element.data.source.url = newText;
        }

        return element;
    }
} as PbEditorPageElementVariableRendererPlugin;

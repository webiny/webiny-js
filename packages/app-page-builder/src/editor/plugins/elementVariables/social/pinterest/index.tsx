import React from "react";
import { PbEditorPageElementVariableRendererPlugin } from "~/types";
import LinkVariableInput from "~/editor/plugins/elementSettings/variable/LinkVariableInput";
import { useElementVariables } from "~/editor/hooks/useElementVariableValue";

export default {
    name: "pb-editor-page-element-variable-renderer-pinterest",
    type: "pb-editor-page-element-variable-renderer",
    elementType: "pinterest",
    getVariableValue(element) {
        const variables = useElementVariables(element);
        return variables.length > 0 ? variables[0].value : null;
    },
    renderVariableInput(variableId: string) {
        return (
            <LinkVariableInput
                variableId={variableId}
                placeholder={"https://pinterest.com/pin/823666219335767857/"}
                description={"Enter a Pinterest URL"}
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

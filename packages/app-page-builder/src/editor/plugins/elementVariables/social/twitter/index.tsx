import React from "react";
import { PbEditorPageElementVariableRendererPlugin } from "~/types";
import LinkVariableInput from "~/editor/plugins/elementSettings/variable/LinkVariableInput";
import { useElementVariables } from "~/editor/hooks/useElementVariableValue";

export default {
    name: "pb-editor-page-element-variable-renderer-twitter",
    type: "pb-editor-page-element-variable-renderer",
    elementType: "twitter",
    getVariableValue(element) {
        const variables = useElementVariables(element);
        return variables.length > 0 ? variables[0].value : null;
    },
    renderVariableInput(variableId: string) {
        return (
            <LinkVariableInput
                variableId={variableId}
                placeholder={"https://twitter.com/"}
                description={"Enter a Tweet URL"}
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

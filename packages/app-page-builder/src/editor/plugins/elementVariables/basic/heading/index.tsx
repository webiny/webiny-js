import React from "react";
import { set } from "dot-prop-immutable";
import { PbEditorPageElementVariableRendererPlugin } from "~/types";
import { RichVariableInput } from "~/editor/plugins/elementSettings/variable/RichVariableInput";
import { useElementVariables } from "~/editor/hooks/useElementVariableValue";
import { CompositionScope } from "@webiny/react-composition";

export default {
    name: "pb-editor-page-element-variable-renderer-heading",
    type: "pb-editor-page-element-variable-renderer",
    elementType: "heading",
    getVariableValue(element) {
        const variables = useElementVariables(element);
        return variables.length > 0 ? variables[0].value : null;
    },
    renderVariableInput(variableId: string) {
        return (
            <CompositionScope name={"pb.heading"}>
                <RichVariableInput variableId={variableId} />
            </CompositionScope>
        );
    },
    setElementValue(element, variables) {
        const newText = variables?.length > 0 ? variables[0].value : null;

        if (newText && element?.data?.text?.data) {
            return set(element, "data.text.data.text", newText);
        }

        return element;
    }
} as PbEditorPageElementVariableRendererPlugin;

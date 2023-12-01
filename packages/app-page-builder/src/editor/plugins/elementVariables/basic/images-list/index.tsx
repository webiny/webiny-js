import React from "react";
import { PbEditorPageElementVariableRendererPlugin } from "~/types";
import MultipleImageVariableInput from "~/editor/plugins/elementSettings/variable/MultipleImageVariableInput";
import { useElementVariables } from "~/editor/hooks/useElementVariableValue";

export default {
    name: "pb-editor-page-element-variable-renderer-images-list",
    type: "pb-editor-page-element-variable-renderer",
    elementType: "images-list",
    getVariableValue(element) {
        const variables = useElementVariables(element);
        return variables.length > 0 ? variables[0].value : null;
    },
    renderVariableInput(variableId: string) {
        return <MultipleImageVariableInput variableId={variableId} />;
    },
    setElementValue(element, variables) {
        const newImages = variables?.length > 0 ? variables[0].value : null;

        if (newImages && element?.data?.images) {
            element.data.images = newImages;
        }

        return element;
    }
} as PbEditorPageElementVariableRendererPlugin;

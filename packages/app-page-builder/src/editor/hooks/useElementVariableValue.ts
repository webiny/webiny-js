import { useMemo } from "react";
import { plugins } from "@webiny/plugins";
import {
    PbBlockVariable,
    PbEditorElement,
    PbEditorPageElementVariableRendererPlugin
} from "~/types";
import { useParentBlock } from "~/editor/hooks/useParentBlock";

export function useElementVariables(element: PbEditorElement | null) {
    const block = useParentBlock(element?.id);

    const variableValue = useMemo(() => {
        if (element?.data?.variableId) {
            const variable = block?.data?.variables?.filter(
                (variable: PbBlockVariable) =>
                    variable.id.split(".")[0] === element?.data?.variableId
            );
            return variable;
        } else {
            return null;
        }
    }, [block, element]);

    return variableValue ?? [];
}

export function useElementVariableValue(element: PbEditorElement | null) {
    const elementVariableRendererPlugins =
        plugins.byType<PbEditorPageElementVariableRendererPlugin>(
            "pb-editor-page-element-variable-renderer"
        );
    const elementVariablePlugin = elementVariableRendererPlugins.find(
        plugin => plugin.elementType === element?.type
    );
    const variableValue = elementVariablePlugin?.getVariableValue(element);

    return variableValue;
}

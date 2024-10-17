import { useMemo } from "react";
import { plugins } from "@webiny/plugins";
import { PbEditorElement, PbEditorPageElementVariableRendererPlugin } from "~/types";
import { useParentBlock } from "~/editor/hooks/useParentBlock";

export function useElementVariables(element: PbEditorElement | null) {
    const block = useParentBlock() as PbEditorElement | null;

    const variableValue = useMemo(() => {
        const { variableId } = element?.data || {};

        if (!variableId || !block) {
            return null;
        }

        const variable = block.data.variables?.filter(
            variable => variable.id.split(".")[0] === variableId
        );

        return variable;
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

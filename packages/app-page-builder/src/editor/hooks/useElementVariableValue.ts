import { useMemo } from "react";
import { PbBlockVariable, PbEditorElement } from "~/types";
import { useParentBlock } from "~/editor/hooks/useParentBlock";

export function useElementVariableValue(element: PbEditorElement | null) {
    const block = useParentBlock(element?.id);

    const variableValue = useMemo(() => {
        if (element?.data?.variableId) {
            const variable = block?.data?.variables?.find(
                (variable: PbBlockVariable) => variable.id === element?.data?.variableId
            );
            return variable?.value;
        } else {
            return null;
        }
    }, [block, element]);

    return variableValue;
}

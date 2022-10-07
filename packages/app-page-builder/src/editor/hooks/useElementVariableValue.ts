import { useMemo } from "react";
import { PbBlockVariable, PbEditorElement } from "~/types";
import { useParentBlock } from "~/editor/hooks/useParentBlock";

export function useElementVariableValue(element: PbEditorElement | null) {
    const block = useParentBlock(element?.id);

    const variableValue = useMemo(() => {
        if (element?.data?.varRef) {
            const variable = block?.data?.variables?.find(
                (variable: PbBlockVariable) => variable.varRef === element?.data?.varRef
            );
            return variable?.value;
        } else {
            return null;
        }
    }, [block, element]);

    return variableValue;
}

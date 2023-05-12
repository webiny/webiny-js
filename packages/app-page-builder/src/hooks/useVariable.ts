import { useCallback } from "react";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { PbBlockVariable } from "~/types";

export function useVariable<TValue = any>(variableId: string) {
    const [element] = useActiveElement();
    const updateElement = useUpdateElement();
    const variable = element?.data?.variables?.find(
        (variable: PbBlockVariable) => variable.id === variableId
    );

    const onChange = useCallback(
        (value: TValue, history = false) => {
            if (element) {
                const newVariables = element?.data?.variables?.map((variable: PbBlockVariable) => {
                    if (variable?.id === variableId) {
                        return {
                            ...variable,
                            value
                        };
                    }

                    return variable;
                });

                updateElement(
                    {
                        ...element,
                        data: {
                            ...element.data,
                            variables: newVariables
                        }
                    },
                    {
                        history
                    }
                );
            }
        },
        [element, variableId, updateElement]
    );

    const onBlur = useCallback(() => {
        if (element) {
            updateElement(element);
        }
    }, [element, updateElement]);

    return { value: variable?.value as TValue, onChange, onBlur };
}

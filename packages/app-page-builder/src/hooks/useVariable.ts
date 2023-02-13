import { useCallback } from "react";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { PbBlockVariable } from "~/types";

export function useVariable(variableId: string) {
    const [element] = useActiveElement();
    const updateElement = useUpdateElement();
    const variable = element?.data?.variables?.find(
        (variable: PbBlockVariable) => variable.id === variableId
    );

    const onChange = useCallback(
        (value: any, history = false) => {
            if (element) {
                const newVariables = element?.data?.variables?.map((variable: PbBlockVariable) => {
                    if (variable?.id === variableId) {
                        console.log("SAME VARIABLE", variable);
                        return {
                            ...variable,
                            value
                        };
                    }

                    return variable;
                });

                console.log("Update element", {
                    ...element,
                    data: {
                        ...element.data,
                        variables: newVariables
                    }
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
            } else {
                console.log("NO ELEMENT");
            }
        },
        [element, variableId, updateElement]
    );

    const onBlur = useCallback(() => {
        if (element) {
            updateElement(element);
        }
    }, [element, updateElement]);

    return { value: variable?.value, onChange, onBlur };
}

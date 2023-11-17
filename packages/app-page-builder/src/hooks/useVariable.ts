import { useCallback, useEffect, useRef } from "react";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { PbBlockVariable } from "~/types";

export function useVariable<TValue = any>(variableId: string) {
    const [element] = useActiveElement();
    const elementRef = useRef(element);
    const updateElement = useUpdateElement();
    const variable = element?.data?.variables?.find(
        (variable: PbBlockVariable) => variable.id === variableId
    );

    // We're storing a reference to an element, so we don't have to recreate the `onChange` callback on every update.
    useEffect(() => {
        elementRef.current = element;
    }, [element]);

    const onChange = useCallback(
        (value: TValue, history = false) => {
            const element = elementRef.current;
            if (!element) {
                return;
            }

            const newVariables = element.data.variables?.map(variable => {
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
        },
        [variableId, updateElement]
    );

    const onBlur = useCallback(() => {
        if (element) {
            updateElement(element);
        }
    }, [element, updateElement]);

    return { value: variable?.value as TValue, onChange, onBlur };
}

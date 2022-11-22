import React, { useMemo } from "react";
import { ImagesList } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";

export const ImagesListPlugin = createComponentPlugin(ImagesList, ImagesListComponent => {
    return function ImageListWithVariables({ element }) {
        const variableValue = useElementVariableValue(element);

        const elementWithVariable = useMemo(() => {
            if (variableValue) {
                return {
                    ...element,
                    data: {
                        ...element.data,
                        images: variableValue
                    }
                };
            }

            return element;
        }, [element, variableValue]);

        return <ImagesListComponent element={elementWithVariable} />;
    };
});

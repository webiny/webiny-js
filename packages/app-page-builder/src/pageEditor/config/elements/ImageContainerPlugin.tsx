import React, { useMemo } from "react";
import { ImageContainer } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";

export const ImageContainerPlugin = createComponentPlugin(
    ImageContainer,
    ImageContainerComponent => {
        return function ImageContainerWithVariables({ element }) {
            const variableValue = useElementVariableValue(element);

            const elementWithVariable = useMemo(() => {
                if (variableValue) {
                    return {
                        ...element,
                        data: {
                            ...element.data,
                            image: { ...element.data.image, file: variableValue }
                        }
                    };
                }

                return element;
            }, [element, variableValue]);

            return <ImageContainerComponent element={elementWithVariable} />;
        };
    }
);

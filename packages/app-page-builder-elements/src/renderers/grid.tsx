import React from "react";
import { Element } from "~/components/Element";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type GridRenderer = ReturnType<typeof createGrid>;

export const createGrid = () => {
    return createRenderer(
        () => {
            const { getElement, getAttributes } = useRenderer();

            return (
                <div {...getAttributes()}>
                    {getElement().elements.map(element => (
                        <Element key={element.id} element={element} />
                    ))}
                </div>
            );
        },
        {
            baseStyles: {
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                width: "100%"
            }
        }
    );
};

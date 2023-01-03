import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type GridRenderer = ReturnType<typeof createGrid>;

export const createGrid = () => {
    return createRenderer(
        () => {
            const { getElement } = useRenderer();

            const element = getElement();
            return <Elements element={element} />;
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



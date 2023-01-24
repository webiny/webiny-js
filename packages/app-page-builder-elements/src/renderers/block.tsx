import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type BlockRenderer = ReturnType<typeof createBlock>;

export const createBlock = () => {
    return createRenderer(
        () => {
            const { getElement } = useRenderer();

            const element = getElement();
            return (
                <>
                    <Elements element={element} />
                    {element.data.blockId && (
                        <ps-tag data-key={"pb-page-block"} data-value={element.data.blockId} />
                    )}
                </>
            );
        },
        {
            baseStyles: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                boxSizing: "border-box"
            }
        }
    );
};

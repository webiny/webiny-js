import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { DynamicSourceProvider } from "@webiny/app-dynamic-pages/contexts/DynamicSource";

export type BlockRenderer = ReturnType<typeof createBlock>;

export const createBlock = () => {
    return createRenderer(
        () => {
            const { getElement } = useRenderer();
            const element = getElement();

            return (
                <DynamicSourceProvider element={element}>
                    <Elements element={element} />
                    {element.data.blockId && (
                        <ps-tag data-key={"pb-page-block"} data-value={element.data.blockId} />
                    )}
                </DynamicSourceProvider>
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

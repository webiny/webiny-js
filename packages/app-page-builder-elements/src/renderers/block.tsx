import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { makeDecoratable } from "@webiny/react-composition";
import { BlockProvider } from "./block/BlockProvider";
export * from "./block/BlockProvider";

const BaseBlockRenderer = createRenderer(
    () => {
        const { getElement } = useRenderer();

        const element = getElement();

        return (
            <BlockProvider block={element}>
                <Elements element={element} />
                {element.data.blockId && (
                    <ps-tag data-key={"pb-page-block"} data-value={element.data.blockId} />
                )}
            </BlockProvider>
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

export const BlockRenderer = makeDecoratable("BlockRenderer", BaseBlockRenderer);

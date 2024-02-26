import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { ElementProps } from "~/components/Element";

export const Block = createRenderer(
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

export type BlockRenderer = ReturnType<typeof createBlock>;

type CreateBlockParams = {
    blockComponent?: (props: ElementProps) => JSX.Element | null;
};

export const createBlock = (params: CreateBlockParams) => {
    const BlockComponent = params.blockComponent || Block;

    return function BlockElement(props: ElementProps) {
        const { element, ...rest } = props;

        return <BlockComponent element={element} {...rest} />;
    };
};

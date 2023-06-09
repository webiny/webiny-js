import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { DynamicSourceProvider } from "@webiny/app-dynamic-pages/contexts/DynamicSource";
import { useBlockVariant } from "@webiny/app-dynamic-pages/hooks/useBlockVariant";
import { Props as ElementProps } from "~/components/Element";
import { Element } from "~/types";

const Block = createRenderer(
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

const VariantBlock = (props: ElementProps) => {
    const { element, ...rest } = props;
    const variant = useBlockVariant(element);

    if (!element.data.isVariantBlock) {
        return <Block element={element} {...rest} />;
    }

    if (variant) {
        return <Block element={variant as Element} {...rest} />;
    }

    return null;
};

export type BlockRenderer = ReturnType<typeof createBlock>;

export const createBlock = () => {
    return function BlockElement(props: ElementProps) {
        const { element, ...rest } = props;

        return (
            <DynamicSourceProvider element={element}>
                <VariantBlock element={element} {...rest} />
            </DynamicSourceProvider>
        );
    };
};

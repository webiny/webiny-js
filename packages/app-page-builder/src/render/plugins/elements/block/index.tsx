import React from "react";

import { DynamicSourceProvider } from "@webiny/app-dynamic-pages/contexts/DynamicSource";
import { useBlockVariant } from "@webiny/app-dynamic-pages/hooks/useBlockVariant";
import { Block } from "@webiny/app-page-builder-elements/renderers/block";
import { ElementProps } from "@webiny/app-page-builder-elements/components/Element";
import { Element } from "@webiny/app-page-builder-elements/types";
import { createBlock } from "@webiny/app-page-builder-elements/renderers/block";

import { PbRenderElementPlugin } from "~/types";

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

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-block",
        type: "pb-render-page-element",
        elementType: "block",
        render: createBlock({
            blockComponent: (props: ElementProps) => {
                const { element, ...rest } = props;
                return (
                    <DynamicSourceProvider element={element}>
                        <VariantBlock element={element} {...rest} />
                    </DynamicSourceProvider>
                );
            }
        })
    };
};

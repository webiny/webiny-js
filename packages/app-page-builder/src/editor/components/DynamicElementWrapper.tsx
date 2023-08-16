import React, { useCallback, useEffect, useState } from "react";
import { PbElement } from "~/types";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { Element } from "@webiny/app-page-builder-elements/types";
import { EditorDynamicSourceProvider } from "@webiny/app-dynamic-pages/contexts/DynamicSource";
import { Filter } from "@webiny/app-dynamic-pages/components/Settings/FilterSettings";

export const DynamicElementWrapper = ({
    element,
    children
}: {
    element: Element;
    children: React.ReactNode;
}) => {
    const { getElementTree } = useEventActionHandler();
    const [pbElement, setPbElement] = useState<PbElement>();

    const refreshDynamicContainer = useCallback(() => {
        setTimeout(async () => {
            const elementTree = (await getElementTree({ element })) as PbElement;

            // For variant blocks query we need paths used inside variant filter conditions
            if (elementTree.data?.isVariantBlock) {
                const variantsPaths: string[] = [];

                for (const variant of elementTree.elements) {
                    variant.data.conditions?.forEach((condition: Filter) =>
                        variantsPaths.push(condition.path)
                    );
                }
            }

            setPbElement(elementTree);
        });
    }, [element]);

    useEffect(() => {
        refreshDynamicContainer();
    }, [element]);

    return (
        <EditorDynamicSourceProvider
            element={pbElement}
            refreshDynamicContainer={refreshDynamicContainer}
        >
            {children}
        </EditorDynamicSourceProvider>
    );
};

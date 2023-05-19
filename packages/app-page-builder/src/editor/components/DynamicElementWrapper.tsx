import React, { useCallback, useEffect, useState } from "react";
import { PbElement } from "~/types";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { Element } from "@webiny/app-page-builder-elements/types";
import { EditorDynamicSourceProvider } from "@webiny/app-dynamic-pages/contexts/DynamicSource";

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
            setPbElement((await getElementTree({ element })) as PbElement);
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

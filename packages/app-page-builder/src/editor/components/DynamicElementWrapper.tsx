import React, { useCallback, useEffect, useState } from "react";
import { PbElement } from "~/types";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { Element } from "@webiny/app-page-builder-elements/types";
import { EditorDynamicSourceProvider } from "@webiny/app-dynamic-pages/contexts/DynamicSource";
import { getChildrenPaths } from "@webiny/app-dynamic-pages/utils/getChildrenPaths";
import { useDynamicDataQuery } from "@webiny/app-dynamic-pages/hooks/useDynamicDataQuery";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";

export const DynamicElementWrapper = ({
    element,
    children
}: {
    element: Element;
    children: React.ReactNode;
}) => {
    const updateElement = useUpdateElement();
    const { getElementTree } = useEventActionHandler();
    const [pbElement, setPbElement] = useState<PbElement>();
    const [paths, setPaths] = useState<string[]>();
    const { data: query } = useDynamicDataQuery({
        paths,
        modelId: element?.data?.dynamicSource?.modelId,
        filter: element?.data?.dynamicSource?.filter,
        sort: element?.data?.dynamicSource?.sortRules,
        limit: element?.data?.dynamicSource?.limit
    });

    const refreshDynamicContainer = useCallback(() => {
        setTimeout(async () => {
            const elementTree = (await getElementTree({ element })) as PbElement;

            setPaths(getChildrenPaths(elementTree.elements));
            setPbElement(elementTree);
        });
    }, [element]);

    useEffect(() => {
        refreshDynamicContainer();
    }, [element]);

    useEffect(() => {
        if (
            element.data?.dynamicSource?.modelId &&
            query &&
            query !== element.data.dynamicSource?.query
        ) {
            updateElement({
                ...element,
                data: { ...element.data, dynamicSource: { ...element.data.dynamicSource, query } }
            });
        }
    }, [query]);

    return (
        <EditorDynamicSourceProvider
            element={pbElement}
            refreshDynamicContainer={refreshDynamicContainer}
        >
            {children}
        </EditorDynamicSourceProvider>
    );
};

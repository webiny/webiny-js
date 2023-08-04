import React, { useCallback, useEffect, useState } from "react";

import { createComponentPlugin } from "@webiny/react-composition";
import { EditorDynamicSourceProvider } from "@webiny/app-dynamic-pages/contexts/DynamicSource";

import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useRecoilValue } from "recoil";
import { elementByIdSelector, rootElementAtom } from "~/editor/recoil/modules";
import Content from "~/editor/components/Editor/Content";
import { PbEditorElement, PbElement } from "~/types";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { parseIdentifier } from "@webiny/utils";

const composeWhere = (entryId?: string) => {
    if (!entryId) {
        return;
    }
    const { id } = parseIdentifier(entryId);
    return { entryId: id };
};

export const ContentPlugin = createComponentPlugin(Content, Original => {
    return function DynamicSourceContentPlugin(): JSX.Element {
        const rootElementId = useRecoilValue(rootElementAtom);
        const [templateAtomValue] = useTemplate();
        const rootElementValue = useRecoilValue(
            elementByIdSelector(rootElementId as string)
        ) as PbEditorElement;
        const { getElementTree } = useEventActionHandler();
        const [pbElement, setPbElement] = useState<PbElement>();

        const refreshDynamicContainer = useCallback(() => {
            setTimeout(async () => {
                setPbElement((await getElementTree({ element: rootElementValue })) as PbElement);
            });
        }, [rootElementValue, templateAtomValue?.templatePageData?.entryId]);

        useEffect(() => {
            refreshDynamicContainer();
        }, [rootElementValue, templateAtomValue?.templatePageData?.entryId]);

        return (
            <EditorDynamicSourceProvider
                element={pbElement}
                refreshDynamicContainer={refreshDynamicContainer}
                templateWhereField={composeWhere(templateAtomValue?.templatePageData?.entryId)}
            >
                <Original />
            </EditorDynamicSourceProvider>
        );
    };
});

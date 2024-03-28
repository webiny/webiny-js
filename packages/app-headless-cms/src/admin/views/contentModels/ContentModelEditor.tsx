import React from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Editor } from "~/admin/components/ContentModelEditor/Editor";
import { useRouter } from "@webiny/react-router";
import { useCms } from "~/admin/hooks";
import { ContentModelEditorProvider } from "~/admin/components/ContentModelEditor";
import { CmsModel } from "~/types";

type QueryMatch = Pick<Partial<CmsModel>, "modelId">;

const ContentModelEditorView = () => {
    const { params } = useRouter();
    const { apolloClient } = useCms();

    const { modelId } = (params ? params : {}) as QueryMatch;
    if (!apolloClient) {
        return null;
    }
    return (
        <ContentModelEditorProvider key={modelId} apolloClient={apolloClient} modelId={modelId}>
            {
                <DndProvider backend={HTML5Backend}>
                    <Editor />
                </DndProvider>
            }
        </ContentModelEditorProvider>
    );
};
export default ContentModelEditorView;

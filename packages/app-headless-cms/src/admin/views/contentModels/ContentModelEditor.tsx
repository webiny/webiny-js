import React from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { ContentModelEditor } from "~/admin/components/ContentModelEditor/ContentModelEditor.js";
import { useRoute } from "@webiny/app-admin";
import { ContentModelEditorProvider } from "~/admin/components/ContentModelEditor/index.js";
import { Routes } from "~/routes.js";

const ContentModelEditorView = () => {
    const { route } = useRoute(Routes.ContentModels.Editor);
    const modelId = route.params.modelId;

    return (
        <ContentModelEditorProvider key={modelId} modelId={modelId}>
            <DndProvider backend={HTML5Backend}>
                <ContentModelEditor />
            </DndProvider>
        </ContentModelEditorProvider>
    );
};
export default ContentModelEditorView;

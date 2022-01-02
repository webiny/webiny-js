import React from "react";
import HTML5Backend from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Editor } from "~/admin/components/ContentModelEditor/Editor";
import { useRouter } from "@webiny/react-router";
import { useCms } from "~/admin/hooks";
import { ContentModelEditorProvider } from "~/admin/components/ContentModelEditor/Context";
type QueryMatch = {
    modelId?: string;
};
export default function ContentModelEditorView() {
    const { match } = useRouter();
    const { apolloClient } = useCms();
    const { modelId } = match.params as QueryMatch;
    if (!apolloClient) {
        return null;
    }
    return (
        <ContentModelEditorProvider key={modelId} apolloClient={apolloClient} modelId={modelId}>
            <DndProvider backend={HTML5Backend}>
                <Editor />
            </DndProvider>
        </ContentModelEditorProvider>
    );
}

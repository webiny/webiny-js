import React from "react";
import HTML5Backend from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Editor } from "~/admin/components/ContentModelEditor/Editor";
import { useRouter } from "@webiny/react-router";
import { useCms } from "~/admin/hooks";
import { ContentModelEditorProvider } from "~/admin/components/ContentModelEditor/Context";
import Snackbar from "@webiny/app-admin/ui/views/AdminView/components/Snackbar";
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
                <div style={{ zIndex: 10, position: "absolute" }}>
                    <Snackbar />
                </div>
            </DndProvider>
        </ContentModelEditorProvider>
    );
}

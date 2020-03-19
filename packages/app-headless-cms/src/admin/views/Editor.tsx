import React from "react";
import HTML5Backend from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import Snackbar from "@webiny/app-admin/plugins/Snackbar/Snackbar";
import { ContentModelEditorApp } from "../components/ContentModelEditor";

export default function EditorView() {
    return (
        <DndProvider backend={HTML5Backend}>
            <ContentModelEditorApp />
            <div style={{ zIndex: 10, position: "absolute" }}>
                <Snackbar />
            </div>
        </DndProvider>
    );
}

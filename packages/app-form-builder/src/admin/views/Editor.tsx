import React from "react";
import HTML5Backend from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import Snackbar from "@webiny/app-admin/ui/views/AdminView/components/Snackbar";
import { FormEditorApp } from "../components/FormEditor";

export default function EditorView() {
    return (
        <DndProvider backend={HTML5Backend}>
            <FormEditorApp />
            <div style={{ zIndex: 10, position: "absolute" }}>
                <Snackbar />
            </div>
        </DndProvider>
    );
}

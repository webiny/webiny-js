import React from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { FormEditorApp } from "../components/FormEditor";

export default function EditorView() {
    return (
        <DndProvider backend={HTML5Backend}>
            <FormEditorApp />
        </DndProvider>
    );
}

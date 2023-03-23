import React from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { FormEditorApp } from "../components/FormEditor";

const EditorView: React.VFC = () => {
    return (
        <DndProvider backend={HTML5Backend}>
            <FormEditorApp />
        </DndProvider>
    );
};
export default EditorView;

import React from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { FormEditorApp } from "../components/FormEditor";

const EditorView = () => {
    return (
        /**
         * react-dnd users old version of React which has children defined by default.
         * This will break build when react-dnd is upgraded, so then we can remove ts-expect-error
         */
        <DndProvider backend={HTML5Backend}>
            <FormEditorApp />
        </DndProvider>
    );
};
export default EditorView;

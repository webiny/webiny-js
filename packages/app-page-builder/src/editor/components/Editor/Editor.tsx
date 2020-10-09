import React, { useEffect } from "react";
import { editorUiAtom } from "../recoil";
import HTML5Backend from "react-dnd-html5-backend";
import classSet from "classnames";
import { useRecoilValue } from "recoil";
import { useRedo, useUndo } from "recoil-undo";
import { DndProvider } from "react-dnd";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import "./Editor.scss";
// Components
import EditorBar from "./Bar";
import EditorToolbar from "./Toolbar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";
import Dialogs from "./Dialogs";

export const Editor = () => {
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const { isDragging, isResizing, slateFocused } = useRecoilValue(editorUiAtom);
    const undo = useUndo();
    const redo = useRedo();

    useEffect(() => {
        addKeyHandler("mod+z", e => {
            if (!slateFocused) {
                e.preventDefault();
                undo();
            }
        });
        addKeyHandler("mod+shift+z", e => {
            if (!slateFocused) {
                e.preventDefault();
                redo();
            }
        });
        return () => {
            removeKeyHandler("mod+z");
            removeKeyHandler("mod+shift+z");
        };
    });
    const classes = {
        "pb-editor": true,
        "pb-editor-dragging": isDragging,
        "pb-editor-resizing": isResizing
    };
    return (
        <DndProvider backend={HTML5Backend}>
            <div className={classSet(classes)}>
                <EditorBar />
                <EditorToolbar />
                <EditorContent />
                <Dialogs />
                <DragPreview />
            </div>
        </DndProvider>
    );
};

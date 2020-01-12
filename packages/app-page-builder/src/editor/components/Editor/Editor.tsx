import React, { useEffect } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import classSet from "classnames";
import { ActionCreators } from "redux-undo";
import HTML5Backend from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { getUi } from "@webiny/app-page-builder/editor/selectors";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import "./Editor.scss";

// Components
import EditorBar from "./Bar";
import EditorToolbar from "./Toolbar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";
import Dialogs from "./Dialogs";

export type EditorProps = {
    isDragging: boolean;
    isResizing: boolean;
    undo: Function;
    redo: Function;
    addKeyHandler: Function;
    removeKeyHandler: Function;
    slateFocused: boolean;
};

const EditorComponent = ({ isDragging, isResizing, undo, redo, slateFocused }: EditorProps) => {
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

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

export const Editor = connect<any, any, any>(
    state => {
        const ui = getUi(state);

        return {
            slateFocused: ui.slateFocused,
            isDragging: ui.dragging,
            isResizing: ui.resizing
        };
    },
    {
        undo: ActionCreators.undo,
        redo: ActionCreators.redo
    }
)(EditorComponent);

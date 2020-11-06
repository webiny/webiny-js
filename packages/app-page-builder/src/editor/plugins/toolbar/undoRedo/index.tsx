import React from "react";
import platform from "platform";
import Action from "../Action";
import { useRedo, useUndo } from "recoil-undo";
import { ReactComponent as UndoIcon } from "@webiny/app-page-builder/editor/assets/icons/undo-icon.svg";
import { ReactComponent as RedoIcon } from "@webiny/app-page-builder/editor/assets/icons/redo-icon.svg";
import { PbEditorToolbarBottomPlugin } from "@webiny/app-page-builder/types";

const metaKey = platform.os.family === "OS X" ? "CMD" : "CTRL";

export const undo: PbEditorToolbarBottomPlugin = {
    name: "pb-editor-toolbar-undo",
    type: "pb-editor-toolbar-bottom",
    renderAction() {
        const undo = useUndo();
        return (
            <Action
                id={"action-undo"}
                tooltip={`Undo (${metaKey}+Z)`}
                onClick={() => undo()}
                icon={<UndoIcon />}
            />
        );
    }
};

export const redo: PbEditorToolbarBottomPlugin = {
    name: "pb-editor-toolbar-redo",
    type: "pb-editor-toolbar-bottom",
    renderAction() {
        const redo = useRedo();
        return (
            <Action
                id={"action-redo"}
                tooltip={`Redo (${metaKey}+SHIFT+Z)`}
                onClick={() => redo()}
                icon={<RedoIcon />}
            />
        );
    }
};

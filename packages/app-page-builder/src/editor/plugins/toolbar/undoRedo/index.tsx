import React from "react";
import platform from "platform";
import Action from "../Action";
import {
    connectedRedo,
    connectedUndo
} from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { ReactComponent as UndoIcon } from "@webiny/app-page-builder/editor/assets/icons/undo-icon.svg";
import { ReactComponent as RedoIcon } from "@webiny/app-page-builder/editor/assets/icons/redo-icon.svg";
import { PbEditorToolbarBottomPlugin } from "@webiny/app-page-builder/types";

const metaKey = platform.os.family === "OS X" ? "CMD" : "CTRL";

export const undo: PbEditorToolbarBottomPlugin = {
    name: "pb-editor-toolbar-undo",
    type: "pb-editor-toolbar-bottom",
    renderAction() {
        return (
            <Action
                tooltip={`Undo (${metaKey}+Z)`}
                onClick={() => connectedUndo()}
                icon={<UndoIcon />}
            />
        );
    }
};

export const redo: PbEditorToolbarBottomPlugin = {
    name: "pb-editor-toolbar-redo",
    type: "pb-editor-toolbar-bottom",
    renderAction() {
        return (
            <Action
                tooltip={`Redo (${metaKey}+SHIFT+Z)`}
                onClick={() => connectedRedo()}
                icon={<RedoIcon />}
            />
        );
    }
};

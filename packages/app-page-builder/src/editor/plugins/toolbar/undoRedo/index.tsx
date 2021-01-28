import React from "react";
import platform from "platform";
import { useSetRecoilState } from "recoil";
import { ReactComponent as UndoIcon } from "@webiny/app-page-builder/editor/assets/icons/undo-icon.svg";
import { ReactComponent as RedoIcon } from "@webiny/app-page-builder/editor/assets/icons/redo-icon.svg";
import { PbEditorToolbarBottomPlugin } from "@webiny/app-page-builder/types";
import { activeElementAtom } from "../../../recoil/modules";
import Action from "../Action";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/hooks/useEventActionHandler";

const metaKey = platform.os.family === "OS X" ? "CMD" : "CTRL";

export const undo: PbEditorToolbarBottomPlugin = {
    name: "pb-editor-toolbar-undo",
    type: "pb-editor-toolbar-bottom",
    renderAction() {
        const { undo } = useEventActionHandler();
        const setActiveElementAtomValue = useSetRecoilState(activeElementAtom);

        const onClick = () => {
            undo();
            setActiveElementAtomValue(null);
        };
        return (
            <Action
                id={"action-undo"}
                tooltip={`Undo (${metaKey}+Z)`}
                onClick={() => onClick()}
                icon={<UndoIcon />}
            />
        );
    }
};

export const redo: PbEditorToolbarBottomPlugin = {
    name: "pb-editor-toolbar-redo",
    type: "pb-editor-toolbar-bottom",
    renderAction() {
        const { redo } = useEventActionHandler();
        const setActiveElementAtomValue = useSetRecoilState(activeElementAtom);

        const onClick = () => {
            setActiveElementAtomValue(null);
            redo();
        };

        return (
            <Action
                id={"action-redo"}
                tooltip={`Redo (${metaKey}+SHIFT+Z)`}
                onClick={() => onClick()}
                icon={<RedoIcon />}
            />
        );
    }
};

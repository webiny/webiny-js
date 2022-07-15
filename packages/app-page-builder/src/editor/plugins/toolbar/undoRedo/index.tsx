import React from "react";
import platform from "platform";
import { ReactComponent as UndoIcon } from "~/editor/assets/icons/undo-icon.svg";
import { ReactComponent as RedoIcon } from "~/editor/assets/icons/redo-icon.svg";
import { PbEditorToolbarBottomPlugin } from "~/types";
import Action from "../Action";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";

const osFamily = platform.os ? platform.os.family : null;
const metaKey = osFamily === "OS X" ? "CMD" : "CTRL";

export const undo: PbEditorToolbarBottomPlugin = {
    name: "pb-editor-toolbar-undo",
    type: "pb-editor-toolbar-bottom",
    renderAction() {
        const { undo, trigger } = useEventActionHandler();
        const [, setActiveElement] = useActiveElement();

        const onClick = async () => {
            undo();
            setActiveElement(null);
            await trigger(new UpdateDocumentActionEvent({ history: false, debounce: true }));
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
        const { redo, trigger } = useEventActionHandler();
        const [, setActiveElement] = useActiveElement();

        const onClick = async () => {
            setActiveElement(null);
            redo();
            await trigger(new UpdateDocumentActionEvent({ history: false, debounce: true }));
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

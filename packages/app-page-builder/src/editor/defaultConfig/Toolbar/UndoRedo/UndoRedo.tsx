import React from "react";
import platform from "platform";
import { EditorConfig } from "~/editor/config";
import { ReactComponent as UndoIcon } from "~/editor/assets/icons/undo-icon.svg";
import { ReactComponent as RedoIcon } from "~/editor/assets/icons/redo-icon.svg";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

const osFamily = platform.os ? platform.os.family : null;
const metaKey = osFamily === "OS X" ? "CMD" : "CTRL";

const { Ui } = EditorConfig;

export const Undo = () => {
    const { undo } = useEventActionHandler();
    const [, setActiveElement] = useActiveElement();

    const onClick = () => {
        undo();
        setActiveElement(null);
    };
    return (
        <Ui.Toolbar.Element.IconButton
            icon={<UndoIcon />}
            label={`Undo (${metaKey}+Z)`}
            onClick={onClick}
        />
    );
};

export const Redo = () => {
    const { redo } = useEventActionHandler();
    const [, setActiveElement] = useActiveElement();

    const onClick = () => {
        setActiveElement(null);
        redo();
    };
    return (
        <Ui.Toolbar.Element.IconButton
            icon={<RedoIcon />}
            label={`Redo (${metaKey}+SHIFT+Z)`}
            onClick={onClick}
        />
    );
};

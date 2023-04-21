import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    INSERT_ORDERED_WEBINY_LIST_COMMAND,
    REMOVE_WEBINY_LIST_COMMAND
} from "~/commands/webiny-list";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";

export const NumberedListAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isActive, setIsActive] = useState<boolean>(false);
    const { textBlockSelection } = useRichTextEditor();
    const isListSelected = textBlockSelection?.state?.list.isSelected;

    useEffect(() => {
        const isListBulletType = textBlockSelection?.state?.textType === "number";
        setIsActive(isListBulletType);
    }, [isListSelected]);

    const formatNumberedList = () => {
        if (!isActive) {
            // will update the active state in the useEffect
            editor.dispatchCommand(INSERT_ORDERED_WEBINY_LIST_COMMAND, { themeStyleId: "list" });
        } else {
            editor.dispatchCommand(REMOVE_WEBINY_LIST_COMMAND, undefined);
            // removing will not update correctly the active state, so we need to set to false manually.
            setIsActive(false);
        }
    };

    return (
        <button
            onClick={() => formatNumberedList()}
            className={"popup-item spaced " + (isActive ? "active" : "")}
            aria-label="Format text as numbered list"
        >
            <i className="icon numbered-list" />
        </button>
    );
};

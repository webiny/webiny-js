import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    INSERT_UNORDERED_WEBINY_LIST_COMMAND,
    REMOVE_WEBINY_LIST_COMMAND
} from "~/commands/webiny-list";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";

export const BulletListAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isActive, setIsActive] = useState<boolean>(false);
    const { textBlockSelection } = useRichTextEditor();
    const isListSelected = textBlockSelection?.state?.list.isSelected;

    useEffect(() => {
        const isListBulletType = textBlockSelection?.state?.textType === "bullet";
        setIsActive(isListBulletType);
    }, [isListSelected]);

    const formatBulletList = () => {
        if (!isActive) {
            // will update the active state in the useEffect
            editor.dispatchCommand(INSERT_UNORDERED_WEBINY_LIST_COMMAND, { themeStyleId: "list1" });
        } else {
            editor.dispatchCommand(REMOVE_WEBINY_LIST_COMMAND, undefined);
        }
    };

    return (
        <button
            onClick={() => formatBulletList()}
            className={"popup-item spaced " + (isActive ? "active" : "")}
            aria-label="Format text as bullet list"
        >
            <i className="icon bullet-list" />
        </button>
    );
};

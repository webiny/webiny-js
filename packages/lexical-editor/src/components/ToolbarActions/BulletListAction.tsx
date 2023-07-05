import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    INSERT_UNORDERED_WEBINY_LIST_COMMAND,
    REMOVE_WEBINY_LIST_COMMAND
} from "~/commands/webiny-list";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";

export const BulletListAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isActive, setIsActive] = useState<boolean>(false);
    const { textBlockSelection, themeEmotionMap } = useRichTextEditor();
    const isListSelected = textBlockSelection?.state?.list.isSelected;

    useEffect(() => {
        const isListBulletType = textBlockSelection?.state?.textType === "bullet";
        setIsActive(isListBulletType);
    }, [textBlockSelection?.state?.textType, isListSelected]);

    const formatBulletList = () => {
        if (!isActive) {
            const styleId = themeEmotionMap
                ? findTypographyStyleByHtmlTag("ul", themeEmotionMap)?.id
                : undefined;
            // will update the active state in the useEffect
            editor.dispatchCommand(INSERT_UNORDERED_WEBINY_LIST_COMMAND, { themeStyleId: styleId });
            setIsActive(true);
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

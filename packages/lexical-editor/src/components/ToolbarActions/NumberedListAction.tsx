import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    INSERT_ORDERED_WEBINY_LIST_COMMAND,
    REMOVE_WEBINY_LIST_COMMAND
} from "~/commands/webiny-list";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";

export const NumberedListAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isActive, setIsActive] = useState<boolean>(false);
    const { textBlockSelection, themeEmotionMap } = useRichTextEditor();

    useEffect(() => {
        const isListNumberType = textBlockSelection?.state?.textType === "number";
        setIsActive(isListNumberType);
    }, [textBlockSelection?.state?.textType]);

    const formatNumberedList = () => {
        if (!isActive) {
            const styleId = themeEmotionMap
                ? findTypographyStyleByHtmlTag("ol", themeEmotionMap)?.id
                : undefined;
            // will update the active state in the useEffect
            editor.dispatchCommand(INSERT_ORDERED_WEBINY_LIST_COMMAND, { themeStyleId: styleId });
        } else {
            editor.dispatchCommand(REMOVE_WEBINY_LIST_COMMAND, undefined);
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

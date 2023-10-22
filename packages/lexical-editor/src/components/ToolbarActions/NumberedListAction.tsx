import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_ORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from "~/commands";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";

export const NumberedListAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isActive, setIsActive] = useState<boolean>(false);
    const { textBlockSelection, themeEmotionMap } = useRichTextEditor();
    const isListSelected = textBlockSelection?.state?.list.isSelected;

    useEffect(() => {
        const isListBulletType = textBlockSelection?.state?.textType === "number";
        setIsActive(isListBulletType);
    }, [textBlockSelection?.state?.textType, isListSelected]);

    const getStyleId = (): string | undefined => {
        if (!themeEmotionMap) {
            return undefined;
        }
        // check default style for numbered list
        const id = findTypographyStyleByHtmlTag("ol", themeEmotionMap)?.id;
        if (id) {
            return id;
        }
        // fallback to ul list styles
        return findTypographyStyleByHtmlTag("ul", themeEmotionMap)?.id;
    };

    const formatNumberedList = () => {
        if (!isActive) {
            const styleId = themeEmotionMap ? getStyleId() : undefined;
            // will update the active state in the useEffect
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, { themeStyleId: styleId });
            setIsActive(true);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
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

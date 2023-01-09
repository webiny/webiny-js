import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React, {useCallback, useContext, useEffect, useState} from "react";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { $getSelection, $isRangeSelection } from "lexical";
import {RichTextEditorContext, RichTextEditorContextProps} from "~/context/RichTextEditorContext";

/**
 * Toolbar action. User can convert selected text in clickble link.
 * - Small size popup will be opened with input so user can enter the link.
 * - To remove the link, user need to select the already added link and click again in the action button.
 */
export const LinkAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isLink, setIsLink] = useState(false);
    const { setNodeIsText  } = useContext<RichTextEditorContextProps>(RichTextEditorContext);

    const insertLink = useCallback(() => {
        if (!isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
            setNodeIsText(false);
        } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink]);

    const updatePopup = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return;
            }
            const node = getSelectedNode(selection);
            // Update links
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }
        });
    }, [editor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updatePopup);
        return () => {
            document.removeEventListener("selectionchange", updatePopup);
        };
    }, [updatePopup]);

    return (
        <button
            onClick={insertLink}
            className={"popup-item spaced " + (isLink ? "active" : "")}
            aria-label="Insert link"
        >
            <i className="format link" />
        </button>
    );
};

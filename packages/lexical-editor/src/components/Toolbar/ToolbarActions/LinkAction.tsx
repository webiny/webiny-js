import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React, { useCallback, useEffect, useState } from "react";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { $getSelection, $isRangeSelection } from "lexical";

/**
 * Toolbar action. On toolbar, you can see the button that is underline.
 */
export const LinkAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isLink, setIsLink] = useState(false);

    const insertLink = useCallback(() => {
        console.log("insert lnk");
        if (!isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
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
            console.log("LINK");
            const node = getSelectedNode(selection);
            // Update links
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                console.log("SET LINK");
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

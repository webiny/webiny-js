import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import React, { useCallback, useEffect, useState } from "react";
export const BOLD_TEXT_ACTION_VALUE = "isBold";

/**
 * Toolbar action. On toolbar you can see as button that is bold.
 */
export const BoldAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);

    const updatePopup = useCallback(() => {
        editor.getEditorState().read(() => {
            // Should not to pop up the floating toolbar when using IME input
            if (editor.isComposing()) {
                return;
            }
            const selection = $getSelection();
            const nativeSelection = window.getSelection();
            const rootElement = editor.getRootElement();

            if (
                nativeSelection !== null &&
                (!$isRangeSelection(selection) ||
                    rootElement === null ||
                    !rootElement.contains(nativeSelection.anchorNode))
            ) {
                return;
            }

            if (!$isRangeSelection(selection)) {
                return;
            }

            // Update text format
            setIsBold(selection.hasFormat("bold"));
        });
    }, [editor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updatePopup);
        return () => {
            document.removeEventListener("selectionchange", updatePopup);
        };
    }, [updatePopup]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(() => {
                updatePopup();
            })
        );
    }, [editor, updatePopup]);

    return (
        <button
            onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={"popup-item spaced " + (isBold ? "active" : "")}
            aria-label="Format text as bold"
        >
            <i className="format bold" />
        </button>
    );
};

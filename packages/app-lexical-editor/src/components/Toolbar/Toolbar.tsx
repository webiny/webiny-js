import { makeComposable } from "@webiny/react-composition";
import React, { useCallback, useEffect, useRef } from "react";
import { ToolbarType } from "~/types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from "lexical";
import { getDOMRangeRect } from "~/utils/getDOMRangeRect";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition";
import { mergeRegister } from "@lexical/utils";

interface ToolbarProps {
    type: ToolbarType;
    anchorElem: HTMLElement;
    children?: React.ReactNode;
}

export const Toolbar = makeComposable<ToolbarProps>("Toolbar", ({ children, anchorElem }) => {
    const [editor] = useLexicalComposerContext();
    const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);

    const updateTextFormatFloatingToolbar = useCallback(() => {
        const selection = $getSelection();

        const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
        const nativeSelection = window.getSelection();

        if (popupCharStylesEditorElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();
        if (
            selection !== null &&
            nativeSelection !== null &&
            !nativeSelection.isCollapsed &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
            setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem);
        }
    }, [editor, anchorElem]);

    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;

        const update = () => {
            editor.getEditorState().read(() => {
                updateTextFormatFloatingToolbar();
            });
        };

        window.addEventListener("resize", update);
        if (scrollerElem) {
            scrollerElem.addEventListener("scroll", update);
        }

        return () => {
            window.removeEventListener("resize", update);
            if (scrollerElem) {
                scrollerElem.removeEventListener("scroll", update);
            }
        };
    }, [editor, updateTextFormatFloatingToolbar, anchorElem]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateTextFormatFloatingToolbar();
        });
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateTextFormatFloatingToolbar();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateTextFormatFloatingToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updateTextFormatFloatingToolbar]);

    return (
        <div ref={popupCharStylesEditorRef} className="floating-text-format-popup">
            {editor.isEditable() && children}
        </div>
    );
});

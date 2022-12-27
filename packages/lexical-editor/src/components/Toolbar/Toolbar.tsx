// @ts-ignore

import { makeComposable } from "@webiny/react-composition";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { ToolbarType } from "~/types";
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_LOW,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { getDOMRangeRect } from "~/utils/getDOMRangeRect";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { $isCodeHighlightNode } from "@lexical/code";
import { createPortal } from "react-dom";
import "./Toolbar.css";

interface FloatingToolbarProps {
    type: ToolbarType;
    anchorElem: HTMLElement;
    children?: React.ReactNode;
    editor: LexicalEditor;
}

const FloatingToolbar: FC<FloatingToolbarProps> = ({ children, anchorElem, editor }) => {
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
};

interface useToolbarProps {
    editor: LexicalEditor;
    type: ToolbarType;
    anchorElem: HTMLElement;
    children?: React.ReactNode;
}

const useToolbar: FC<useToolbarProps> = ({
    editor,
    anchorElem = document.body,
    type,
    children
}): JSX.Element | null => {
    const [isText, setIsText] = useState(false);

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
                setIsText(false);
                return;
            }

            if (!$isRangeSelection(selection)) {
                return;
            }

            const node = getSelectedNode(selection);

            if (
                !$isCodeHighlightNode(selection.anchor.getNode()) &&
                selection.getTextContent() !== ""
            ) {
                setIsText($isTextNode(node));
            } else {
                setIsText(false);
            }
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
            }),
            editor.registerRootListener(() => {
                if (editor.getRootElement() === null) {
                    setIsText(false);
                }
            })
        );
    }, [editor, updatePopup]);

    if (!isText) {
        return null;
    }

    return createPortal(
        <FloatingToolbar type={type} anchorElem={anchorElem} editor={editor}>
            {children}
        </FloatingToolbar>,
        anchorElem
    );
};

interface ToolbarProps {
    type: ToolbarType;
    anchorElem: HTMLElement;
    children?: React.ReactNode;
}

/**
 * @description Main toolbar container
 */
export const Toolbar = makeComposable<ToolbarProps>(
    "Toolbar",
    ({ anchorElem, type, children }): JSX.Element | null => {
        const [editor] = useLexicalComposerContext();
        return useToolbar({ editor, anchorElem, type, children });
    }
);

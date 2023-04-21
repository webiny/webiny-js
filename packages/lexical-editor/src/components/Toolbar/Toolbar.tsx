import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_LOW,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { makeComposable } from "@webiny/react-composition";
import { $isLinkNode } from "@lexical/link";
import { createPortal } from "react-dom";
import { mergeRegister } from "@lexical/utils";
import { $isCodeHighlightNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import "./Toolbar.css";
import { ToolbarType } from "~/types";
import { getDOMRangeRect } from "~/utils/getDOMRangeRect";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { getLexicalTextSelectionState } from "~/utils/getLexicalTextSelectionState";

interface FloatingToolbarProps {
    type: ToolbarType;
    anchorElem: HTMLElement;
    children?: React.ReactNode;
    editor: LexicalEditor;
}

const FloatingToolbar: FC<FloatingToolbarProps> = ({ children, type, anchorElem, editor }) => {
    const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
    const { toolbarType, setToolbarType, setTextBlockSelection } = useRichTextEditor();
    const [activeEditor, setActiveEditor] = useState(editor);

    useEffect(() => {
        if (toolbarType !== type) {
            setToolbarType(type);
        }
    }, [type]);

    const updateTextFormatFloatingToolbar = useCallback(() => {
        const selection = $getSelection();

        const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
        const nativeSelection = window.getSelection();

        if (popupCharStylesEditorElem === null) {
            return;
        }

        let isLink = false;
        if ($isRangeSelection(selection)) {
            const selectionState = getLexicalTextSelectionState(activeEditor, selection);
            if (selectionState) {
                setTextBlockSelection(selectionState);
            }
            const node = getSelectedNode(selection);
            // Update links
            const parent = node.getParent();

            if ($isLinkNode(parent) || $isLinkNode(node)) {
                isLink = true;
            }
        }

        const rootElement = editor.getRootElement();
        if (
            selection !== null &&
            nativeSelection !== null &&
            !nativeSelection.isCollapsed &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode) &&
            !isLink
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
                (_payload, newEditor) => {
                    updateTextFormatFloatingToolbar();
                    setActiveEditor(newEditor);
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
    const { nodeIsText, setNodeIsText } = useRichTextEditor();

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
                setNodeIsText(false);
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
                setNodeIsText($isTextNode(node));
            } else {
                setNodeIsText(false);
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
                    setNodeIsText(false);
                }
            })
        );
    }, [editor, updatePopup]);

    if (!nodeIsText) {
        return null;
    }

    return createPortal(
        <FloatingToolbar type={type} anchorElem={anchorElem} editor={editor}>
            {children}
        </FloatingToolbar>,
        anchorElem
    );
};

export interface ToolbarProps {
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

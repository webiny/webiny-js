import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_LOW,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { makeComposable } from "@webiny/react-composition";
import { createPortal } from "react-dom";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import "./Toolbar.css";
import { ToolbarType } from "~/types";
import { getDOMRangeRect } from "~/utils/getDOMRangeRect";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition";
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
    const { toolbarType, setToolbarType } = useRichTextEditor();

    useEffect(() => {
        if (toolbarType !== type) {
            setToolbarType(type);
        }
    }, [type]);

    const mouseMoveListener = useCallback((e: MouseEvent) => {
        if (popupCharStylesEditorRef?.current && (e.buttons === 1 || e.buttons === 3)) {
            if (popupCharStylesEditorRef.current.style.pointerEvents !== "none") {
                const x = e.clientX;
                const y = e.clientY;
                const elementUnderMouse = document.elementFromPoint(x, y);

                if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
                    // Mouse is not over the target element => not a normal click, but probably a drag
                    popupCharStylesEditorRef.current.style.pointerEvents = "none";
                }
            }
        }
    }, [popupCharStylesEditorRef]);

    const mouseUpListener = useCallback(() => {
        if (popupCharStylesEditorRef?.current) {
            if (popupCharStylesEditorRef.current.style.pointerEvents !== "auto") {
                popupCharStylesEditorRef.current.style.pointerEvents = "auto";
            }
        }
    }, [popupCharStylesEditorRef]);

    useEffect(() => {
        if (popupCharStylesEditorRef?.current) {
            document.addEventListener("mousemove", mouseMoveListener);
            document.addEventListener("mouseup", mouseUpListener);

            return () => {
                document.removeEventListener("mousemove", mouseMoveListener);
                document.removeEventListener("mouseup", mouseUpListener);
            };
        }
        return;
    }, [popupCharStylesEditorRef]);

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
    const { nodeIsText, setNodeIsText, setActiveEditor, setIsEditable, setTextBlockSelection } =
        useRichTextEditor();

    const [toolbarActiveEditor, setToolbarActiveEditor] = useState<LexicalEditor>(editor);

    const updateToolbar = useCallback(() => {
        editor.getEditorState().read(() => {
            // Should not to pop up the floating toolbar when using IME input
            if (editor.isComposing()) {
                return;
            }

            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
                const selectionState = getLexicalTextSelectionState(toolbarActiveEditor, selection);
                if (selectionState) {
                    setTextBlockSelection(selectionState);
                    if (selectionState.selectedText !== "") {
                        setNodeIsText(true);
                    } else {
                        setNodeIsText(false);
                    }
                }
            }

            if (!$isRangeSelection(selection)) {
                setNodeIsText(false);
                return;
            }
        });
    }, [toolbarActiveEditor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updateToolbar);
        return () => {
            document.removeEventListener("selectionchange", updateToolbar);
        };
    }, [updateToolbar]);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            (_payload, newEditor) => {
                updateToolbar();
                setToolbarActiveEditor(newEditor);
                setActiveEditor(newEditor);
                return false;
            },
            COMMAND_PRIORITY_CRITICAL
        );
    }, [editor, updateToolbar]);

    useEffect(() => {
        return mergeRegister(
            editor.registerEditableListener(editable => {
                setIsEditable(editable);
            }),
            toolbarActiveEditor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerRootListener(() => {
                if (editor.getRootElement() === null) {
                    setNodeIsText(false);
                }
            })
        );
    }, [updateToolbar, editor, toolbarActiveEditor]);

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

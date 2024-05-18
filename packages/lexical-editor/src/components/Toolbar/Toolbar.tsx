import React, { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
    $getSelection,
    BLUR_COMMAND,
    COMMAND_PRIORITY_LOW,
    LexicalEditor,
    RangeSelection,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { createPortal } from "react-dom";
import { mergeRegister } from "@lexical/utils";
import { $isLinkNode } from "@webiny/lexical-nodes";
import "./Toolbar.css";
import { getDOMRangeRect } from "~/utils/getDOMRangeRect";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition";
import { useLexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { useRichTextEditor } from "~/hooks";
import { isChildOfFloatingToolbar } from "~/utils/isChildOfFloatingToolbar";

interface FloatingToolbarProps {
    anchorElem: HTMLElement;
    editor: LexicalEditor;
}

const FloatingToolbar: FC<FloatingToolbarProps> = ({ anchorElem, editor }) => {
    const [isVisible, setIsVisible] = useState(true);
    const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
    const { toolbarElements } = useLexicalEditorConfig();

    const mouseMoveListener = useCallback(
        (e: MouseEvent) => {
            /* Indicates which mouse button(s) was pressed.
             / 1 = mouse left button
             / 3 = mouse left and right button in the same time
             / More info: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
             */
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
        },
        [popupCharStylesEditorRef]
    );

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
                    setIsVisible(true);
                    updateTextFormatFloatingToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),

            editor.registerCommand(
                BLUR_COMMAND,
                payload => {
                    if (!isChildOfFloatingToolbar(payload.relatedTarget as HTMLElement)) {
                        setIsVisible(false);
                    }

                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updateTextFormatFloatingToolbar]);

    if (!isVisible) {
        return null;
    }

    return (
        <div ref={popupCharStylesEditorRef} className="floating-toolbar">
            {editor.isEditable() && (
                <>
                    {toolbarElements.map(action => (
                        <Fragment key={action.name}>{action.element}</Fragment>
                    ))}
                </>
            )}
        </div>
    );
};

/**
 * TODO: this logic should live in Node classes. A toolbar should not decide when to show itself.
 */
function isLinkNode(selection: RangeSelection) {
    const node = getSelectedNode(selection);
    const parent = node.getParent();

    return $isLinkNode(parent) || $isLinkNode(node);
}

export interface ToolbarProps {
    anchorElem?: HTMLElement;
}

export const Toolbar = ({ anchorElem = document.body }: ToolbarProps) => {
    const { editor } = useRichTextEditor();
    const showToolbar = useDeriveValueFromSelection(({ rangeSelection }) => {
        if (!rangeSelection) {
            return false;
        }

        return !isLinkNode(rangeSelection) && !rangeSelection.isCollapsed();
    });

    if (!showToolbar) {
        return null;
    }

    return createPortal(<FloatingToolbar anchorElem={anchorElem} editor={editor} />, anchorElem);
};

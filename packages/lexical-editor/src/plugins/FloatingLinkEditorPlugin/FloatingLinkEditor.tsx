import React, { useCallback, useEffect, useRef, useState } from "react";
import { getSelectedNode } from "~/utils/getSelectedNode.js";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition.js";
import { sanitizeUrl } from "~/utils/sanitizeUrl.js";
import { isChildOfLinkEditor } from "./isChildOfLinkEditor.js";
import { LinkEditForm as DefaultLinkEditForm } from "./LinkEditForm.js";
import { LinkPreviewForm } from "./LinkPreviewForm.js";
import {
    SELECTION_CHANGE_COMMAND,
    type BaseSelection,
    type LexicalEditor,
    COMMAND_PRIORITY_LOW,
    BLUR_COMMAND,
    $getSelection,
    $isRangeSelection
} from "lexical";
import { mergeRegister } from "@lexical/utils";

export interface LinkData {
    url: string;
    target: string | null;
    alt: string | null;
}

interface FloatingLinkEditorProps {
    editor: LexicalEditor;
    isVisible: boolean;
    anchorElem: HTMLElement;
    LinkEditForm?: typeof DefaultLinkEditForm;
}

export function FloatingLinkEditor({
    editor,
    isVisible,
    anchorElem,
    LinkEditForm = DefaultLinkEditForm
}: FloatingLinkEditorProps) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [linkData, setLinkData] = useState<LinkData>({
        url: "",
        target: null,
        alt: null
    });

    const [isEditMode, setEditMode] = useState(false);
    const [lastSelection, setLastSelection] = useState<BaseSelection | null>(null);

    const updateLinkEditor = useCallback(() => {
        const selection = $getSelection();
        const emptyLinkData = { url: "", target: null, alt: null };
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();

            if ($isLinkNode(parent)) {
                const linkData = {
                    url: parent.getURL(),
                    target: parent.getTarget(),
                    alt: $isLinkNode(parent) ? parent.getAlt() : null
                };
                setLinkData(linkData);
            } else if ($isLinkNode(node)) {
                const linkData = {
                    url: node.getURL(),
                    target: node.getTarget(),
                    alt: $isLinkNode(node) ? node.getAlt() : null
                };
                setLinkData(linkData);
            } else {
                setLinkData(emptyLinkData);
            }
        }
        const editorElem = editorRef.current;
        const nativeSelection = window.getSelection();
        const activeElement = document.activeElement;

        if (editorElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();

        if (
            selection !== null &&
            nativeSelection !== null &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const domRange = nativeSelection.getRangeAt(0);
            let rect;
            if (nativeSelection.anchorNode === rootElement) {
                let inner = rootElement;
                while (inner.firstElementChild != null) {
                    inner = inner.firstElementChild as HTMLElement;
                }
                rect = inner.getBoundingClientRect();
            } else {
                rect = domRange.getBoundingClientRect();
            }

            setFloatingElemPosition(rect, editorElem, anchorElem);
            setLastSelection(selection);
        } else if (!activeElement || activeElement.className !== "link-input") {
            if (rootElement !== null) {
                setFloatingElemPosition(null, editorElem, anchorElem);
            }
            setLastSelection(null);
            setEditMode(false);
            setLinkData(emptyLinkData);
        }

        return true;
    }, [anchorElem, editor]);

    const removeLink = () => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        setEditMode(false);
    };

    const applyChanges = (linkData: LinkData) => {
        const confirmedLinkData = {
            url: sanitizeUrl(linkData.url),
            target: linkData.target,
            alt: linkData.alt
        };

        if (lastSelection !== null) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, confirmedLinkData);
            setEditMode(false);
        }
    };

    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;

        const update = () => {
            editor.read(() => {
                updateLinkEditor();
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
    }, [anchorElem.parentElement, editor, updateLinkEditor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateLinkEditor();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateLinkEditor();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),

            editor.registerCommand(
                BLUR_COMMAND,
                payload => {
                    if (!isChildOfLinkEditor(payload.relatedTarget as HTMLElement)) {
                        // setEditMode(false);
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        editor.read(() => {
            updateLinkEditor();
        });
    }, [editor, updateLinkEditor]);

    return (
        <div
            ref={editorRef}
            className="link-editor"
            style={{ display: isVisible ? "block" : "none" }}
        >
            {isEditMode ? (
                <LinkEditForm
                    linkData={linkData}
                    onSave={applyChanges}
                    onCancel={() => setEditMode(false)}
                />
            ) : (
                <LinkPreviewForm
                    linkData={linkData}
                    removeLink={removeLink}
                    onEdit={() => {
                        setEditMode(true);
                    }}
                />
            )}
        </div>
    );
}

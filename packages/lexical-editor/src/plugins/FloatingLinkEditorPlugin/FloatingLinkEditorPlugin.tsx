import React, { useCallback, useEffect, useRef, useState } from "react";
import "./FloatingLinkEditorPlugin.css";
import { $isAutoLinkNode, $isLinkNode as $isBaseLinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_LOW,
    GridSelection,
    LexicalEditor,
    NodeSelection,
    RangeSelection,
    SELECTION_CHANGE_COMMAND
} from "lexical";

import { createPortal } from "react-dom";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition";
import { TOGGLE_LINK_NODE_COMMAND } from "~/commands/link";
import { $isLinkNode } from "~/nodes/LinkNode";
import { LinkPreviewForm } from "~/plugins/FloatingLinkEditorPlugin/LinkPreviewForm";
import { LinkEditForm } from "~/plugins/FloatingLinkEditorPlugin/LinkEditForm";

function FloatingLinkEditor({
    editor,
    anchorElem
}: {
    editor: LexicalEditor;
    anchorElem: HTMLElement;
}): JSX.Element {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [linkUrl, setLinkUrl] = useState<{
        url: string;
        target: string | null;
        alt?: string;
    }>({
        url: "",
        target: null,
        alt: undefined
    });
    const [isEditMode, setEditMode] = useState(false);
    const [lastSelection, setLastSelection] = useState<
        RangeSelection | GridSelection | NodeSelection | null
    >(null);

    const updateLinkEditor = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();

            if ($isBaseLinkNode(parent) || $isLinkNode(parent)) {
                setLinkUrl({
                    url: parent.getURL(),
                    target: parent.getTarget(),
                    alt: $isLinkNode(parent) ? parent.getAlt() : undefined
                });
            } else if ($isBaseLinkNode(node) || $isLinkNode(node)) {
                setLinkUrl({
                    url: node.getURL(),
                    target: node.getTarget(),
                    alt: $isLinkNode(node) ? node.getAlt() : undefined
                });
            } else {
                setLinkUrl({ url: "", target: null, alt: undefined });
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
            setLinkUrl({ url: "", target: null, alt: undefined });
        }

        return true;
    }, [anchorElem, editor]);

    const removeLink = () => {
        editor.dispatchCommand(TOGGLE_LINK_NODE_COMMAND, null);
        setEditMode(false);
    };

    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;

        const update = () => {
            editor.getEditorState().read(() => {
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
                    return true;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateLinkEditor();
        });
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        if (isEditMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditMode]);

    return (
        <div ref={editorRef} className="link-editor">
            {isEditMode ? (
                <LinkEditForm
                    editor={editor}
                    linkUrl={linkUrl}
                    setEditMode={setEditMode}
                    inputRef={inputRef}
                    setLinkUrl={setLinkUrl}
                    lastSelection={lastSelection}
                />
            ) : (
                <LinkPreviewForm
                    linkUrl={linkUrl}
                    removeLink={removeLink}
                    setEditMode={setEditMode}
                />
            )}
        </div>
    );
}

function useFloatingLinkEditorToolbar(
    editor: LexicalEditor,
    anchorElem: HTMLElement
): JSX.Element | null {
    const [activeEditor, setActiveEditor] = useState(editor);
    const [isLink, setIsLink] = useState(false);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const linkParent = $findMatchingParent(node, $isBaseLinkNode);
            const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode);

            // We don't want this menu to open for auto links.
            if (linkParent != null && autoLinkParent == null) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }
        }
    }, []);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            (_payload, newEditor) => {
                updateToolbar();
                setActiveEditor(newEditor);
                return false;
            },
            COMMAND_PRIORITY_CRITICAL
        );
    }, [editor, updateToolbar]);

    return isLink
        ? createPortal(
              <FloatingLinkEditor editor={activeEditor} anchorElem={anchorElem} />,
              anchorElem
          )
        : null;
}

export function FloatingLinkEditorPlugin({
    anchorElem = document.body
}: {
    anchorElem?: HTMLElement;
}): JSX.Element | null {
    const [editor] = useLexicalComposerContext();
    return useFloatingLinkEditorToolbar(editor, anchorElem);
}

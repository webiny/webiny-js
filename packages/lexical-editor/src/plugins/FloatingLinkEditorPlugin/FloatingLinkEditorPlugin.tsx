import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./FloatingLinkEditorPlugin.css";
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
    SELECTION_CHANGE_COMMAND,
    BLUR_COMMAND
} from "lexical";

import { $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";
import { LinkPreview } from "~/ui/LinkPreview";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { sanitizeUrl } from "~/utils/sanitizeUrl";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition";
import { isUrlLinkReference } from "~/utils/isUrlLinkReference";
import { isChildOfLinkEditor } from "./isChildOfLinkEditor";

function FloatingLinkEditor({
    editor,
    anchorElem
}: {
    editor: LexicalEditor;
    anchorElem: HTMLElement;
}): JSX.Element {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [linkUrl, setLinkUrl] = useState<{ url: string; target: string | null }>({
        url: "",
        target: null
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
            if ($isLinkNode(parent)) {
                setLinkUrl({ url: parent.getURL(), target: parent.getTarget() });
            } else if ($isLinkNode(node)) {
                setLinkUrl({ url: node.getURL(), target: node.getTarget() });
            } else {
                setLinkUrl({ url: "", target: null });
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
            setLinkUrl({ url: "", target: null });
        }

        return true;
    }, [anchorElem, editor]);

    const removeLink = () => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
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
                <>
                    <div className={"link-editor-target-checkbox"}>
                        <input
                            type={"checkbox"}
                            checked={linkUrl.target === "_blank"}
                            disabled={isUrlLinkReference(linkUrl.url)}
                            onChange={() =>
                                setLinkUrl({ ...linkUrl, target: linkUrl.target ? null : "_blank" })
                            }
                        />{" "}
                        <span>New tab</span>
                    </div>
                    <input
                        ref={inputRef}
                        className="link-input"
                        value={linkUrl.url}
                        onChange={event => {
                            setLinkUrl({ url: event.target.value, target: null });
                        }}
                        onKeyDown={event => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                if (lastSelection !== null) {
                                    if (linkUrl.url !== "") {
                                        editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
                                            url: sanitizeUrl(linkUrl.url),
                                            target: linkUrl.target
                                        });
                                    }
                                    setEditMode(false);
                                }
                            } else if (event.key === "Escape") {
                                event.preventDefault();
                                setEditMode(false);
                            }
                        }}
                    />
                </>
            ) : (
                <>
                    <div className={"link-editor-target-checkbox"}>
                        <input type={"checkbox"} checked={linkUrl.target === "_blank"} readOnly />{" "}
                        <span>New tab</span>
                    </div>
                    <div className="link-input">
                        <a href={linkUrl.url} target="_blank" rel="noopener noreferrer">
                            {linkUrl.url}
                        </a>
                        <div
                            className="link-edit"
                            role="button"
                            tabIndex={0}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => {
                                setEditMode(true);
                            }}
                        />
                        <div
                            className="link-unlink"
                            role="button"
                            tabIndex={0}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => {
                                removeLink();
                            }}
                        />
                    </div>
                    <LinkPreview url={linkUrl.url} />
                </>
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
        if ($isRangeSelection(selection) && selection.dirty) {
            const node = getSelectedNode(selection);
            const linkParent = $findMatchingParent(node, $isLinkNode);
            const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode);

            // We don't want this menu to open for auto links.
            if (linkParent != null && autoLinkParent == null) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }
        } else {
            setIsLink(false);
        }
    }, []);

    useEffect(() => {
        const offSelectionChange = editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            (_payload, newEditor) => {
                updateToolbar();
                setActiveEditor(newEditor);
                return false;
            },
            COMMAND_PRIORITY_CRITICAL
        );

        const offBlur = editor.registerCommand(
            BLUR_COMMAND,
            _payload => {
                if (!isChildOfLinkEditor(_payload.relatedTarget as HTMLElement)) {
                    setIsLink(false);
                }

                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        return () => {
            offSelectionChange();
            offBlur();
        };
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

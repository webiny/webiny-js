import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import debounce from "lodash/debounce";
import "./FloatingLinkEditorPlugin.css";
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
import { useRichTextEditor } from "~/hooks";

interface FloatingLinkEditorProps {
    editor: LexicalEditor;
    isVisible: boolean;
    anchorElem: HTMLElement;
}

function FloatingLinkEditor({ editor, isVisible, anchorElem }: FloatingLinkEditorProps) {
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
        <div
            ref={editorRef}
            className="link-editor"
            style={{ display: isVisible ? "block" : "none" }}
        >
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

function useFloatingLinkEditorToolbar(anchorElem: HTMLElement): JSX.Element | null {
    const { editor } = useRichTextEditor();
    const [isLink, setIsLink] = useState(false);

    const debounceSetIsLink = useCallback(debounce(setIsLink, 50), []);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }

        const node = getSelectedNode(selection);
        const linkParent = $findMatchingParent(node, $isLinkNode);
        const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode);
        const isLinkOrChildOfLink = Boolean($isLinkNode(node) || linkParent);

        if (!isLinkOrChildOfLink) {
            // When hiding the toolbar, we want to hide immediately.
            setIsLink(false);
        }

        if (selection.dirty) {
            // We don't want this menu to open for auto links.
            if (linkParent != null && autoLinkParent == null) {
                // When showing the toolbar, we want to debounce it, because sometimes selection gets updated
                // multiple times, and the `selection.dirty` flag goes from true to false multiple times,
                // eventually settling on `false`, which we want to set once it has settled.
                debounceSetIsLink(true);
            }
        }
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL
            ),
            editor.registerCommand(
                BLUR_COMMAND,
                payload => {
                    if (!isChildOfLinkEditor(payload.relatedTarget as HTMLElement)) {
                        setIsLink(false);
                    }

                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                TOGGLE_LINK_COMMAND,
                payload => {
                    setIsLink(!!payload);
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL
            )
        );
    }, [editor, updateToolbar]);

    return createPortal(
        <FloatingLinkEditor isVisible={isLink} editor={editor} anchorElem={anchorElem} />,
        anchorElem
    );
}

export function FloatingLinkEditorPlugin({
    anchorElem = document.body
}: {
    anchorElem?: HTMLElement;
}): JSX.Element | null {
    return useFloatingLinkEditorToolbar(anchorElem);
}

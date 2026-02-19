import { useCallback, useEffect, useRef, useState } from "react";
import {
    SELECTION_CHANGE_COMMAND,
    type BaseSelection,
    type LexicalEditor,
    COMMAND_PRIORITY_LOW,
    $getSelection,
    $isRangeSelection
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";
import { getSelectedNode } from "~/utils/getSelectedNode.js";
import { setFloatingElemPosition } from "~/utils/setFloatingElemPosition.js";
import { sanitizeUrl } from "~/utils/sanitizeUrl.js";
import { LinkData } from "./types.js";

const emptyLinkData: LinkData = { url: "", target: null, alt: null };

function getSelectionKey(selection: BaseSelection | null): string | null {
    if ($isRangeSelection(selection)) {
        return `${selection.anchor.key}:${selection.anchor.offset}-${selection.focus.key}:${selection.focus.offset}`;
    }
    return null;
}

function getLinkDataFromSelection(): LinkData {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return emptyLinkData;
    }

    const node = getSelectedNode(selection);
    const parent = node.getParent();

    if ($isLinkNode(parent)) {
        return {
            url: parent.getURL(),
            target: parent.getTarget(),
            alt: parent.getAlt()
        };
    }

    if ($isLinkNode(node)) {
        return {
            url: node.getURL(),
            target: node.getTarget(),
            alt: node.getAlt()
        };
    }

    return emptyLinkData;
}

export function useFloatingLinkEditor(editor: LexicalEditor) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [linkData, setLinkData] = useState<LinkData>(emptyLinkData);
    const [lastSelection, setLastSelection] = useState<BaseSelection | null>(null);
    const suppressedSelectionKeyRef = useRef<string | null>(null);

    const updateLinkEditor = useCallback(() => {
        const selection = $getSelection();
        const selectionKey = getSelectionKey(selection);

        // If we're still on the same selection that was suppressed, hide the popover.
        if (suppressedSelectionKeyRef.current !== null) {
            if (selectionKey === suppressedSelectionKeyRef.current) {
                const editorElem = editorRef.current;
                if (editorElem) {
                    setFloatingElemPosition(null, editorElem);
                }
                setLastSelection(null);
                setLinkData(emptyLinkData);
                return true;
            }
            // New selection — clear suppression.
            suppressedSelectionKeyRef.current = null;
        }

        setLinkData(getLinkDataFromSelection());

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
            const range = nativeSelection.getRangeAt(0);
            setFloatingElemPosition(range, editorElem);
            setLastSelection(selection);
        } else if (!activeElement || activeElement.className !== "link-input") {
            if (rootElement !== null) {
                setFloatingElemPosition(null, editorElem);
            }
            setLastSelection(null);
            setLinkData(emptyLinkData);
        }

        return true;
    }, [editor]);

    const removeLink = useCallback(() => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }, [editor]);

    const applyChanges = useCallback(
        (linkData: LinkData) => {
            const confirmedLinkData = {
                url: sanitizeUrl(linkData.url),
                target: linkData.target,
                alt: linkData.alt
            };

            if (lastSelection !== null) {
                editor.read(() => {
                    const selection = $getSelection();
                    suppressedSelectionKeyRef.current = getSelectionKey(selection);
                });

                editor.dispatchCommand(TOGGLE_LINK_COMMAND, confirmedLinkData);
            }

            setLastSelection(null);
        },
        [editor, lastSelection]
    );

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
            )
        );
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        editor.read(() => {
            updateLinkEditor();
        });
    }, [editor, updateLinkEditor]);

    return { editorRef, linkData, applyChanges, removeLink };
}

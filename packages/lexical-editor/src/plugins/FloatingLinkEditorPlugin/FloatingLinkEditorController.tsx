import React, { useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRichTextEditor } from "~/hooks/index.js";
import { getSelectedNode } from "~/utils/getSelectedNode.js";
import { $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";
import { isChildOfLinkEditor } from "~/plugins/FloatingLinkEditorPlugin/isChildOfLinkEditor.js";
import debounce from "lodash/debounce.js";
import {
    $getSelection,
    $isRangeSelection,
    BLUR_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_LOW,
    type LexicalEditor,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { FloatingLinkEditor } from "./FloatingLinkEditor.js";
import type { LinkEditForm } from "./LinkEditForm.js";
import type { LinkPreviewForm } from "./LinkPreviewForm.js";

interface FloatingLinkEditorProps {
    anchorElem?: (editor: LexicalEditor) => HTMLElement;
    LinkEditForm?: typeof LinkEditForm;
    LinkPreviewForm?: typeof LinkPreviewForm;
}

const defaultGetAnchorElement = (editor: LexicalEditor): HTMLElement => {
    const rootElement = editor.getRootElement();
    if (!rootElement) {
        return document.body;
    }
    const shell = rootElement.closest(".editor-shell");
    if (!shell) {
        return document.body;
    }
    const overlays = shell.previousElementSibling;

    return (overlays ?? document.body) as HTMLElement;
};

export const FloatingLinkEditorController = (props: FloatingLinkEditorProps) => {
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

    const getAnchorElement = props.anchorElem || defaultGetAnchorElement;

    const anchorElement = getAnchorElement(editor)!;

    return createPortal(
        <FloatingLinkEditor
            isVisible={isLink}
            editor={editor}
            anchorElem={anchorElement}
            LinkEditForm={props.LinkEditForm}
            LinkPreviewForm={props.LinkPreviewForm}
        />,
        anchorElement
    );
};

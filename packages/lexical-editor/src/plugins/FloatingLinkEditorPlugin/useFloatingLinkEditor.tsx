import React, { useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRichTextEditor } from "~/hooks";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";
import { isChildOfLinkEditor } from "~/plugins/FloatingLinkEditorPlugin/isChildOfLinkEditor";
import debounce from "lodash/debounce";
import {
    $getSelection,
    $isRangeSelection,
    BLUR_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_LOW,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { FloatingLinkEditor } from "./FloatingLinkEditorPlugin";

export function useFloatingLinkEditor(anchorElem: HTMLElement): JSX.Element | null {
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

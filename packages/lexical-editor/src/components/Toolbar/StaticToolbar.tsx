import React, { FC, useCallback, useEffect } from "react";
import { $getSelection, $isRangeSelection, $isTextNode, LexicalEditor } from "lexical";
import { ToolbarType } from "~/types";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { $isCodeHighlightNode } from "@lexical/code";
import { mergeRegister } from "@lexical/utils";
import { makeComposable } from "@webiny/react-composition";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import "./StaticToolbar.css";

interface useStaticToolbarProps {
    editor: LexicalEditor;
    type: ToolbarType;
    children?: React.ReactNode;
    actionPlugins?: { type: string; plugin: Record<string, any> }[];
}

const useStaticToolbar: FC<useStaticToolbarProps> = ({
    editor,
    actionPlugins,
    type,
    children
}): JSX.Element | null => {
    const { setNodeIsText, setActionPlugins, setToolbarType } = useRichTextEditor();

    useEffect(() => {
        if (actionPlugins) {
            setActionPlugins(actionPlugins || []);
        }
    }, [actionPlugins]);

    useEffect(() => {
        if (type) {
            setToolbarType(type);
        }
    }, [type]);

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

    return <div className="static-toolbar">{editor.isEditable() && children}</div>;
};

export interface StaticToolbarToolbarProps {
    type: ToolbarType;
    children?: React.ReactNode;
    actionPlugins?: { type: string; plugin: Record<string, any> }[];
}

/**
 * @description Main static toolbar container
 */
export const StaticToolbar = makeComposable<StaticToolbarToolbarProps>(
    "StaticToolbar",
    ({ type, actionPlugins, children }): JSX.Element | null => {
        const [editor] = useLexicalComposerContext();
        return useStaticToolbar({ actionPlugins, editor, type, children });
    }
);

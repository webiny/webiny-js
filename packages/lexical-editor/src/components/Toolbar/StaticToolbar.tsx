import React, { FC, useCallback, useEffect, useState } from "react";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { ToolbarType } from "~/types";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { mergeRegister } from "@lexical/utils";
import { makeComposable } from "@webiny/react-composition";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import "./StaticToolbar.css";
import { getLexicalTextSelectionState } from "~/utils/getLexicalTextSelectionState";

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
    const { setNodeIsText, setActionPlugins, setToolbarType, setTextBlockSelection } =
        useRichTextEditor();
    const [toolbarActiveEditor, setToolbarActiveEditor] = useState<LexicalEditor>(editor);

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
                return false;
            },
            COMMAND_PRIORITY_CRITICAL
        );
    }, [editor, updateToolbar]);

    useEffect(() => {
        return mergeRegister(
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

    return <div className="static-toolbar">{editor.isEditable() && children}</div>;
};

export interface StaticToolbarToolbarProps {
    children?: React.ReactNode;
    actionPlugins?: { type: string; plugin: Record<string, any> }[];
}

/**
 * @description Main toolbar container
 */
export const StaticToolbar = makeComposable<StaticToolbarToolbarProps>(
    "StaticToolbar",
    ({ actionPlugins, children }): JSX.Element | null => {
        const [editor] = useLexicalComposerContext();
        return useStaticToolbar({ actionPlugins, editor, type: "static", children });
    }
);

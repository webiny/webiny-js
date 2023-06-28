import React, { FC, Fragment, useCallback, useEffect, useState } from "react";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import "./StaticToolbar.css";
import { getLexicalTextSelectionState } from "~/utils/getLexicalTextSelectionState";
import { useLexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig";

interface useStaticToolbarProps {
    editor: LexicalEditor;
}

const useStaticToolbar: FC<useStaticToolbarProps> = ({ editor }) => {
    const { setNodeIsText, setTextBlockSelection, setActiveEditor } = useRichTextEditor();
    const [toolbarActiveEditor, setToolbarActiveEditor] = useState<LexicalEditor>(editor);
    const { toolbarElements } = useLexicalEditorConfig();

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
                    if (
                        selectionState.selectedText !== "" &&
                        !selectionState.state?.link.isSelected
                    ) {
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
                setActiveEditor(newEditor);
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
            }),
            editor.registerRootListener(() => {
                if (editor.getRootElement() === null) {
                    setNodeIsText(false);
                }
            })
        );
    }, [updateToolbar, editor, toolbarActiveEditor]);

    return (
        <div className="static-toolbar">
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

export const StaticToolbar = () => {
    const [editor] = useLexicalComposerContext();
    return useStaticToolbar({ editor });
};

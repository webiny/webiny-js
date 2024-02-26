import type { LexicalEditor } from "lexical";
import { mergeRegister } from "@lexical/utils";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    INDENT_CONTENT_COMMAND,
    INSERT_PARAGRAPH_COMMAND,
    KEY_BACKSPACE_COMMAND,
    OUTDENT_CONTENT_COMMAND
} from "lexical";
import { useEffect } from "react";
import {
    $handleListInsertParagraph,
    indentList,
    insertList,
    outdentList,
    removeList,
    $isListNode
} from "@webiny/lexical-nodes";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND
} from "~/commands";
import { getNodeFromSelection } from "~/hooks/useCurrentElement";

export function useList(editor: LexicalEditor): void {
    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                INDENT_CONTENT_COMMAND,
                () => {
                    indentList();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                OUTDENT_CONTENT_COMMAND,
                () => {
                    outdentList();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                INSERT_ORDERED_LIST_COMMAND,
                ({ themeStyleId }) => {
                    insertList(editor, "number", themeStyleId);
                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                INSERT_UNORDERED_LIST_COMMAND,
                ({ themeStyleId }) => {
                    insertList(editor, "bullet", themeStyleId);
                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                (event: KeyboardEvent) => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const node = getNodeFromSelection(selection);
                        if (!$isListNode(node)) {
                            return false;
                        }

                        // Check if list have one list item remain, without text.
                        if (node.getChildren().length === 1 && !node.getTextContent()) {
                            event.preventDefault();
                            removeList(editor);
                            return true;
                        }
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                REMOVE_LIST_COMMAND,
                () => {
                    removeList(editor);
                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                INSERT_PARAGRAPH_COMMAND,
                () => {
                    return $handleListInsertParagraph();
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor]);
}

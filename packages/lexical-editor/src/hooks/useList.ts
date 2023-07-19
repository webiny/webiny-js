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
    removeList
} from "~/nodes/ListNode/formatList";
import {
    INSERT_ORDERED_WEBINY_LIST_COMMAND,
    INSERT_UNORDERED_WEBINY_LIST_COMMAND,
    REMOVE_WEBINY_LIST_COMMAND
} from "~/commands/webiny-list";
import { getLexicalTextSelectionState } from "~/utils/getLexicalTextSelectionState";

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
                INSERT_ORDERED_WEBINY_LIST_COMMAND,
                ({ themeStyleId }) => {
                    insertList(editor, "number", themeStyleId);
                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                INSERT_UNORDERED_WEBINY_LIST_COMMAND,
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
                        const textSelection = getLexicalTextSelectionState(editor, selection);
                        // Check if list have one list item remain, without text.
                        if (
                            textSelection?.state?.list.isSelected &&
                            textSelection?.element?.__size === 1 &&
                            typeof textSelection?.anchorNode.__text === "undefined"
                        ) {
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
                REMOVE_WEBINY_LIST_COMMAND,
                () => {
                    removeList(editor);
                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                INSERT_PARAGRAPH_COMMAND,
                () => {
                    const hasHandledInsertParagraph = $handleListInsertParagraph();

                    if (hasHandledInsertParagraph) {
                        return true;
                    }

                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor]);
}

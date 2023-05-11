import type { LexicalEditor } from "lexical";
import { mergeRegister } from "@lexical/utils";
import {
    COMMAND_PRIORITY_LOW,
    INDENT_CONTENT_COMMAND,
    INSERT_PARAGRAPH_COMMAND,
    OUTDENT_CONTENT_COMMAND
} from "lexical";
import { useEffect } from "react";
import {
    $handleListInsertParagraph,
    indentList,
    insertList,
    outdentList,
    removeList
} from "~/nodes/list-node/formatList";
import {
    INSERT_ORDERED_WEBINY_LIST_COMMAND,
    INSERT_UNORDERED_WEBINY_LIST_COMMAND,
    REMOVE_WEBINY_LIST_COMMAND
} from "~/commands/webiny-list";

export function useBaseList(editor: LexicalEditor): void {
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

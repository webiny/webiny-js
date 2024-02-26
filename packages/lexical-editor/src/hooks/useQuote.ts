import { useEffect } from "react";
import { LexicalEditor, COMMAND_PRIORITY_LOW } from "lexical";
import { mergeRegister } from "@lexical/utils";
import { formatToQuote } from "@webiny/lexical-nodes";
import { INSERT_QUOTE_COMMAND } from "~/commands";

export function useQuote(editor: LexicalEditor): void {
    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                INSERT_QUOTE_COMMAND,
                ({ themeStyleId }) => {
                    formatToQuote(editor, themeStyleId);
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor]);
}

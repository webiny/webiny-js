import type { LexicalEditor } from "lexical";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";
import { INSERT_WEBINY_QUOTE_COMMAND } from "~/commands/webiny-quote";
import { formatToQuote } from "~/utils/nodes/formatToQuote";

export function useWebinyQuote(editor: LexicalEditor): void {
    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                INSERT_WEBINY_QUOTE_COMMAND,
                ({ themeStyleId }) => {
                    formatToQuote(editor, themeStyleId);
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor]);
}

import { useEffect } from "react";
import { formatToQuote, QuoteNode } from "@webiny/lexical-nodes";
import { COMMAND_PRIORITY_LOW, mergeRegister } from "lexical";
import { useRichTextEditor } from "~/hooks/index.js";
import { INSERT_QUOTE_COMMAND } from "~/commands/index.js";

export function QuotePlugin() {
    const { editor } = useRichTextEditor();

    useEffect(() => {
        if (!editor.hasNodes([QuoteNode])) {
            throw new Error("QuoteNodePlugin: QuoteNode is not registered in the editor!");
        }
    }, [editor]);

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

    return null;
}

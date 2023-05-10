import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { BaseQuoteNode } from "~/nodes/BaseQuoteNode";
import { useWebinyQuote } from "~/hooks/useWebinyQuote";

export function WebinyQuotePlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([BaseQuoteNode])) {
            throw new Error("WebinyQuoteNodePlugin: BaseQuoteNode is e not registered on editor");
        }
    }, [editor]);

    useWebinyQuote(editor);

    return null;
}

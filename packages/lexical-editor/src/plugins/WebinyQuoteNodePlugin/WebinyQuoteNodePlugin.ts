import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { QuoteNode } from "~/nodes/QuoteNode";
import { useWebinyQuote } from "~/hooks/useWebinyQuote";

export function WebinyQuotePlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([QuoteNode])) {
            throw new Error("WebinyQuoteNodePlugin: BaseQuoteNode is e not registered on editor");
        }
    }, [editor]);

    useWebinyQuote(editor);

    return null;
}

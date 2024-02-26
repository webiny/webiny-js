import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { QuoteNode } from "@webiny/lexical-nodes";
import { useQuote } from "~/hooks/useQuote";

export function QuotePlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([QuoteNode])) {
            throw new Error("QuoteNodePlugin: QuoteNode is e not registered on editor");
        }
    }, [editor]);

    useQuote(editor);

    return null;
}

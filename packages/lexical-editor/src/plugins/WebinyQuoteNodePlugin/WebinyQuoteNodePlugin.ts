import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { WebinyQuoteNode } from "~/nodes/WebinyQuoteNode";
import {useWebinyQuote} from "~/hooks/useWebinyQuote";

export function WebinyQuotePlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([WebinyQuoteNode])) {
            throw new Error(
                "WebinyQuoteNodePlugin: WebinyQuoteNode is e not registered on editor"
            );
        }
    }, [editor]);

    useWebinyQuote(editor);

    return null;
}

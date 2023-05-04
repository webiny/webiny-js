import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { WebinyListNode } from "~/nodes/ListNode/WebinyListNode";
import { WebinyListItemNode } from "~/nodes/ListNode/WebinyListItemNode";
import { useWebinyList } from "~/hooks/useWebinyList";

export function WebinyListPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([WebinyListNode, WebinyListItemNode])) {
            throw new Error(
                "WebinyListPlugin: WebinyListNode and/or WebinyListItemNode not registered on editor"
            );
        }
    }, [editor]);

    useWebinyList(editor);

    return null;
}

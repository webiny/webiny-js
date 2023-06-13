import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { ListNode } from "~/nodes/ListNode";
import { ListItemNode } from "~/nodes/ListItemNode";
import { useList } from "~/hooks/useList";

export function WebinyListPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([ListNode, ListItemNode])) {
            throw new Error(
                "WebinyListPlugin: WebinyListNode and/or WebinyListItemNode not registered on editor"
            );
        }
    }, [editor]);

    useList(editor);

    return null;
}

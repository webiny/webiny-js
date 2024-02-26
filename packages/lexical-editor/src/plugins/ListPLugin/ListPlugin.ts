import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListNode, ListItemNode } from "@webiny/lexical-nodes";
import { useList } from "~/hooks/useList";

export function ListPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([ListNode, ListItemNode])) {
            throw new Error("ListPlugin: ListNode and/or ListItemNode not registered on editor");
        }
    }, [editor]);

    useList(editor);

    return null;
}

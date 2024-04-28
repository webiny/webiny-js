import { useEffect } from "react";
import { ListNode, ListItemNode } from "@webiny/lexical-nodes";
import { useList, useRichTextEditor } from "~/hooks";

export function ListPlugin(): null {
    const { editor } = useRichTextEditor();

    useEffect(() => {
        if (!editor.hasNodes([ListNode, ListItemNode])) {
            throw new Error(
                "ListPlugin: ListNode and/or ListItemNode not registered in the editor!"
            );
        }
    }, [editor]);

    useList(editor);

    return null;
}

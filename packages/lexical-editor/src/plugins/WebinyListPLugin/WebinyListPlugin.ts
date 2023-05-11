import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { BaseListNode } from "~/nodes/list-node/BaseListNode";
import { BaseListItemNode } from "~/nodes/list-node/BaseListItemNode";
import { useBaseList } from "~/hooks/useBaseList";

export function WebinyListPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([BaseListNode, BaseListItemNode])) {
            throw new Error(
                "WebinyListPlugin: WebinyListNode and/or WebinyListItemNode not registered on editor"
            );
        }
    }, [editor]);

    useBaseList(editor);

    return null;
}

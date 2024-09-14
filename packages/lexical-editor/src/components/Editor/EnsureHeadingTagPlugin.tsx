import { useEffect } from "react";
import { ParagraphNode, $createHeadingNode } from "@webiny/lexical-nodes";
import { useRichTextEditor } from "~/hooks";

/**
 * In the "Heading" editor, we only want to support heading tags.
 * However, when the editor is empty, and you start typing, Lexical automatically creates an empty "paragraph" node.
 * This ensures that any paragraph node is automatically converted to a heading node.
 */
export const EnsureHeadingTagPlugin = () => {
    const { editor } = useRichTextEditor();

    useEffect(
        () =>
            editor.registerNodeTransform(ParagraphNode, node => {
                node.replace($createHeadingNode("h1"), true);
            }),
        []
    );
    return null;
};

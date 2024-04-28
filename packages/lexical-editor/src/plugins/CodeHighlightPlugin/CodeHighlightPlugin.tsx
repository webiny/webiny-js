import { useEffect } from "react";
import { registerCodeHighlighting } from "@lexical/code";
import { useRichTextEditor } from "~/hooks";

export function CodeHighlightPlugin() {
    const { editor } = useRichTextEditor();
    useEffect(() => {
        return registerCodeHighlighting(editor);
    }, [editor]);
    return null;
}

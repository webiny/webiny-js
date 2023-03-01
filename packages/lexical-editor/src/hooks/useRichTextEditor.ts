import { useContext } from "react";
import { RichTextEditorContext } from "~/context/RichTextEditorContext";

export function useRichTextEditor() {
    const context = useContext(RichTextEditorContext);
    if (!context) {
        throw Error(
            `Missing RichTextEditorContext in the component hierarchy. Are you using "useRichTextEditor()" in the right place?`
        );
    }

    return context;
}

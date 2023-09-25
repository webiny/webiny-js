import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $isNodeSelection } from "lexical";

export function useCurrentSelection() {
    const [editor] = useLexicalComposerContext();
    const [selection, setSelection] = useState<ReturnType<typeof $getSelection>>(null);

    const storeSelection = useCallback(() => {
        editor.getEditorState().read(() => {
            setSelection($getSelection());
        });
    }, [editor]);

    useEffect(() => {
        // On first mount, store current selection.
        storeSelection();

        // Subscribe to editor updates and keep track of the selection.
        return editor.registerUpdateListener(storeSelection);
    }, []);

    return {
        selection,
        rangeSelection: $isRangeSelection(selection) ? selection : null,
        nodeSelection: $isNodeSelection(selection) ? selection : null
    };
}

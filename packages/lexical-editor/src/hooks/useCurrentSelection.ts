import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    $isNodeSelection,
    RangeSelection,
    NodeSelection
} from "lexical";
import { useIsMounted } from "./useIsMounted";

export interface CurrentSelection {
    selection: ReturnType<typeof $getSelection>;
    rangeSelection: RangeSelection | null;
    nodeSelection: NodeSelection | null;
}

interface Generator<T> {
    (params: CurrentSelection): T;
}

function getOutput(selection: ReturnType<typeof $getSelection>) {
    return {
        selection,
        rangeSelection: $isRangeSelection(selection) ? selection : null,
        nodeSelection: $isNodeSelection(selection) ? selection : null
    };
}

export function useCurrentSelection() {
    const [editor] = useLexicalComposerContext();
    const [selection, setSelection] = useState<CurrentSelection>(getOutput(null));
    const isMounted = useIsMounted();

    const storeSelection = useCallback(() => {
        editor.getEditorState().read(() => {
            if (isMounted()) {
                setSelection(getOutput($getSelection()));
            }
        });
    }, [editor]);

    useEffect(() => {
        // On first mount, store current selection.
        storeSelection();

        // Subscribe to editor updates and keep track of the selection.
        return editor.registerUpdateListener(storeSelection);
    }, []);

    return selection;
}

export function useDeriveValueFromSelection<T>(generator: Generator<T>) {
    const [editor] = useLexicalComposerContext();
    const [value, setValue] = useState<T>(generator(getOutput(null)));
    const isMounted = useIsMounted();

    const generateValue = useCallback(() => {
        editor.getEditorState().read(() => {
            if (isMounted()) {
                setValue(generator(getOutput($getSelection())));
            }
        });
    }, [editor]);

    useEffect(() => {
        // On first mount, generate current value.
        generateValue();

        // Subscribe to editor updates and regenerate the value.
        return editor.registerUpdateListener(generateValue);
    }, []);

    return value;
}

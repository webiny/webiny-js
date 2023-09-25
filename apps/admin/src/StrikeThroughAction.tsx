import React, { useCallback, useEffect, useState } from "react";
import { LexicalEditorConfig } from "@webiny/app-page-builder";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND, $getSelection, $isRangeSelection, $isNodeSelection } from "lexical";

function useEditorSelection() {
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

const StrikeThroughAction = () => {
    const [editor] = useLexicalComposerContext();
    const { rangeSelection } = useEditorSelection();

    const isStrikeThrough = rangeSelection ? rangeSelection.hasFormat("strikethrough") : false;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
    };

    return (
        <button
            onClick={handleClick}
            className={"popup-item spaced " + (isStrikeThrough ? "active" : "")}
            aria-label="Strike through text"
        >
            <i className="format strikethrough" />
        </button>
    );
};

export const LexicalPlugins = () => {
    return (
        <LexicalEditorConfig>
            <LexicalEditorConfig.Paragraph.FloatingToolbarAction
                name={"strikeThrough"}
                after={"italic"}
                element={<StrikeThroughAction />}
            />
        </LexicalEditorConfig>
    );
};

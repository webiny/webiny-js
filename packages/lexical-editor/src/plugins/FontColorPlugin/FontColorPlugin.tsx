import { useEffect } from "react";
import { ADD_FONT_COLOR_COMMAND, FontColorPayload } from "@webiny/lexical-nodes";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from "lexical";
import { useRichTextEditor } from "~/hooks";
import { applyColorToSelection } from "./applyColorToSelection";

export const FontColorPlugin = () => {
    const { editor } = useRichTextEditor();

    useEffect(() => {
        return editor.registerCommand<FontColorPayload>(
            ADD_FONT_COLOR_COMMAND,
            payload => {
                editor.update(() => {
                    const { color } = payload;
                    const selection = $getSelection();

                    if ($isRangeSelection(selection)) {
                        applyColorToSelection(selection, color);
                    }
                });
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
};

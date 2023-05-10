import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { BLUR_COMMAND, COMMAND_PRIORITY_LOW } from "lexical";
import { LexicalValue } from "~/types";

interface BlurEventPlugin {
    onBlur?: (editorState: LexicalValue) => void;
}

export const BlurEventPlugin: React.VFC<BlurEventPlugin> = ({ onBlur }) => {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerCommand(
                BLUR_COMMAND,
                () => {
                    if (typeof onBlur === "function") {
                        const editorState = editor.getEditorState();
                        onBlur(JSON.stringify(editorState.toJSON()));
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
        []
    );
    return null;
};

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React, { FC, useEffect } from "react";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { getEmptyEditorStateJSONString } from "~/utils/getEmptyEditorStateJSONString";
import { EditorStateJSONString } from "~/types";

interface LexicalUpdateStatePlugin {
    value: EditorStateJSONString | undefined | null;
    readOnly?: boolean;
}

/*
 * Updates the lexical state if new value is provided to the lexical editor trough props
 */
export const LexicalUpdateStatePlugin: FC<LexicalUpdateStatePlugin> = ({
    value
}): React.ReactElement => {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        if (value && editor) {
            const editorState = editor.getEditorState();
            if (JSON.stringify(editorState.toJSON()) === value) {
                return;
            }

            const initialEditorState = editor.parseEditorState(
                isValidLexicalData(value) ? value : getEmptyEditorStateJSONString()
            );
            editor.setEditorState(initialEditorState);
        }
    }, [value, editor]);

    return <></>;
};

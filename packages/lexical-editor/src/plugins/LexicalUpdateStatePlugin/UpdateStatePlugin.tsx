import { useEffect } from "react";
import { parseLexicalState } from "~/utils/isValidLexicalData";
import { generateInitialLexicalValue } from "~/utils/generateInitialLexicalValue";
import { LexicalValue } from "~/types";
import { useRichTextEditor } from "~/hooks";

interface UpdateStatePluginProps {
    value: LexicalValue | null;
}

/**
 * Updates the lexical state if new value is provided to the lexical editor through props.
 */
export const UpdateStatePlugin = ({ value }: UpdateStatePluginProps) => {
    const { editor } = useRichTextEditor();
    useEffect(() => {
        if (value && editor) {
            let newState;

            editor.update(() => {
                const editorState = editor.getEditorState();

                if (JSON.stringify(editorState.toJSON()) === value) {
                    return;
                }

                try {
                    const parsedState = parseLexicalState(value);
                    newState = editor.parseEditorState(
                        parsedState || generateInitialLexicalValue()
                    );
                } catch (err) {
                    console.log("Lexical state update error", err.message);
                    // Ignore errors
                }
            });

            // We must set the state outside the `editor.update()` callback to prevent freezing.
            // https://lexical.dev/docs/api/classes/lexical.LexicalEditor#seteditorstate
            if (newState) {
                const state = newState;
                queueMicrotask(() => {
                    editor.setEditorState(state);
                });
            }
        }
    }, [value, editor]);

    return null;
};

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { parseLexicalState } from "~/utils/isValidLexicalData";
import { generateInitialLexicalValue } from "~/utils/generateInitialLexicalValue";
import { LexicalValue } from "~/types";

interface UpdateStatePluginProps {
    value: LexicalValue | null;
}

/**
 * Updates the lexical state if new value is provided to the lexical editor trough props.
 */
export const UpdateStatePlugin = ({ value }: UpdateStatePluginProps) => {
    const [editor] = useLexicalComposerContext();
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
                editor.setEditorState(newState);
            }
        }
    }, [value, editor]);

    return null;
};

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
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
            editor.update(() => {
                const editorState = editor.getEditorState();

                if (JSON.stringify(editorState.toJSON()) === value) {
                    return;
                }

                try {
                    const initialEditorState = editor.parseEditorState(
                        isValidLexicalData(value)
                            ? (value as string)
                            : (generateInitialLexicalValue() as string)
                    );
                    editor.setEditorState(initialEditorState);
                } catch (err) {
                    console.log("Lexical state update error", err.message);
                    // Ignore errors
                }
            });
        }
    }, [value, editor]);

    return null;
};

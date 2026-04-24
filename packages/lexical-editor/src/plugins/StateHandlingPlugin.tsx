import React, { useEffect, useRef, useMemo } from "react";
import debounce from "lodash/debounce.js";
import { OnChangePlugin as BaseOnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import type { EditorState, LexicalEditor } from "lexical";
import { $isRootTextContentEmpty } from "@lexical/text";
import { generateInitialLexicalValue, prepareLexicalState } from "@webiny/lexical-nodes";
import { normalizeInputValue } from "~/components/Editor/normalizeInputValue.js";
import type { LexicalValue } from "~/types.js";
import { useRichTextEditor } from "~/hooks/index.js";
import { parseLexicalState } from "~/utils/isValidLexicalData.js";

interface OnChangeProps {
    value: string | null | undefined;
    onChange?: (value: LexicalValue) => void;
}

export const StateHandlingPlugin = (props: OnChangeProps) => {
    const { editor } = useRichTextEditor();
    const lastEmittedRef = useRef("");
    const lastOnChangeTimestampRef = useRef(0);

    const value = normalizeInputValue(props.value);
    const editorInputValue = prepareLexicalState(value);

    const handleOnChange = useMemo(() => {
        return debounce((editorState: EditorState, editor: LexicalEditor) => {
            editorState.read(() => {
                if (typeof props.onChange === "function") {
                    const editorState = editor.getEditorState();
                    const isEditorEmpty = $isRootTextContentEmpty(editor.isComposing(), true);

                    if (!value && isEditorEmpty) {
                        return;
                    }

                    const newValue = JSON.stringify(editorState.toJSON());

                    if (newValue !== lastEmittedRef.current) {
                        lastEmittedRef.current = newValue;
                        lastOnChangeTimestampRef.current = Date.now();
                        props.onChange(newValue);
                    }
                }
            });
        }, 300);
    }, [props.onChange, editor]);

    useEffect(() => {
        if (!value || !editor || value === lastEmittedRef.current) {
            return;
        }

        const now = Date.now();
        if (now - lastOnChangeTimestampRef.current < 500) {
            return;
        }

        const parsedState = parseLexicalState(editorInputValue);

        let newState: EditorState | undefined;

        const currentSerialized = JSON.stringify(editor.getEditorState().toJSON());

        if (currentSerialized === editorInputValue) {
            return;
        }

        try {
            newState = editor.parseEditorState(parsedState || generateInitialLexicalValue());
        } catch {
            // Ignore errors
        }

        // We must set the state outside the `editor.update()` callback to prevent freezing.
        // https://lexical.dev/docs/api/classes/lexical.LexicalEditor#seteditorstate
        if (newState) {
            const state = newState;
            queueMicrotask(() => {
                try {
                    editor.setEditorState(state);
                } catch (e) {
                    console.error(e);
                }
            });
        }
    }, [value, editor, editorInputValue]);

    return <BaseOnChangePlugin onChange={handleOnChange} ignoreSelectionChange={true} />;
};

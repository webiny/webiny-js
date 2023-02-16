import React, { useRef, useState } from "react";
import { EditorStateJSONString } from "~/types";
import { Placeholder } from "~/ui/Placeholder";
import { getEmptyEditorStateJSONString } from "~/utils/getEmptyEditorStateJSONString";
import { WebinyNodes } from "~/nodes/webinyNodes";
import { theme } from "~/themes/webinyLexicalTheme";
import { EditorState } from "lexical/LexicalEditorState";
import { Klass, LexicalEditor, LexicalNode } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { makeComposable } from "@webiny/react-composition";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextEditorProvider } from "~/context/RichTextEditorContext";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { LexicalUpdateStatePlugin } from "~/plugins/LexicalUpdateStatePlugin";
import { BlurEventPlugin } from "~/plugins/BlurEventPlugin/BlurEventPlugin";

export interface RichTextEditorProps {
    toolbar: React.ReactNode;
    tag: string;
    onChange?: (json: EditorStateJSONString) => void;
    initValue: EditorStateJSONString | null;
    value?: EditorStateJSONString | null;
    placeholder?: string;
    nodes?: Klass<LexicalNode>[];
    /**
     * @description Lexical plugins
     */
    children?: React.ReactNode | React.ReactNode[];
    onBlur?: (editorState: EditorStateJSONString) => void;
}

const BaseRichTextEditor: React.FC<RichTextEditorProps> = ({
    toolbar,
    onChange,
    initValue,
    value,
    nodes,
    placeholder,
    children,
    onBlur
}: RichTextEditorProps) => {
    const placeholderElem = <Placeholder>{placeholder || "Enter text..."}</Placeholder>;
    const scrollRef = useRef(null);
    const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLElement | undefined>(
        undefined
    );

    const onRef = (_floatingAnchorElem: HTMLDivElement) => {
        if (_floatingAnchorElem !== null) {
            setFloatingAnchorElem(_floatingAnchorElem);
        }
    };

    const initialConfig = {
        editorState: isValidLexicalData(initValue) ? initValue : getEmptyEditorStateJSONString(),
        namespace: "webiny",
        onError: (error: Error) => {
            throw error;
        },
        nodes: [...WebinyNodes, ...(nodes || [])],
        theme: theme
    };

    function handleOnChange(editorState: EditorState, editor: LexicalEditor) {
        editorState.read(() => {
            if (typeof onChange === "function") {
                const editorState = editor.getEditorState();
                onChange(JSON.stringify(editorState.toJSON()));
            }
        });
    }

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div ref={scrollRef}>
                {/* data */}
                <OnChangePlugin onChange={handleOnChange} />
                {value && <LexicalUpdateStatePlugin value={value} />}
                <ClearEditorPlugin />
                {/* Events */}
                {onBlur && <BlurEventPlugin onBlur={onBlur} />}
                <AutoFocusPlugin />
                {/* External plugins and components */}
                {children}
                <RichTextPlugin
                    contentEditable={
                        <div className="editor-scroller">
                            <div className="editor" ref={onRef}>
                                <ContentEditable style={{ outline: 0 }} />
                            </div>
                        </div>
                    }
                    placeholder={placeholderElem}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                {/* Toolbar */}
                {floatingAnchorElem && toolbar}
            </div>
        </LexicalComposer>
    );
};

/**
 * @description Main editor container
 */
export const RichTextEditor = makeComposable<RichTextEditorProps>("RichTextEditor", props => {
    return (
        <RichTextEditorProvider>
            <BaseRichTextEditor {...props} />
        </RichTextEditorProvider>
    );
});

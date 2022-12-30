import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import ClickableLinkPlugin from "../../plugins/ClickableLinkPlugin";
import React from "react";
import ContentEditable from "../../ui/ContentEditable";
import theme from "../../themes/webinyLexicalTheme";
import Placeholder from "../../ui/Placeholder";
import { EditorState } from "lexical/LexicalEditorState";
import { LexicalEditor } from "lexical";
import WebinyNodes from "../../nodes/webinyNodes";
import { HeadingToolbar } from "~/components/Toolbar/HeadingToolbar";
import CodeHighlightPlugin from "~/plugins/CodeHighlightPlugin/CodeHighlightPlugin";
import FloatingLinkEditorPlugin from "~/plugins/FloatingLinkEditorPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalAutoLinkPlugin } from "~/plugins/AutoLinkPlugin";
import { EditorStateJSONString } from "~/types";
import {EditorProps} from "~/components/Editor/RichTextEditor";
import {getEmptyEditorStateJSONString} from "~/utils/getEmptyEditorStateJSONString";


interface HeadingLexicalInputProps extends EditorProps {
    onChange?: (editorState: EditorStateJSONString) => void;
}

const HeadingLexicalEditor: React.FC<HeadingLexicalInputProps> = ({ value, onChange }) => {
    const placeholderText = "Enter some heading text...";
    const placeholder = <Placeholder>{placeholderText}</Placeholder>;
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
        editorState: value ?? getEmptyEditorStateJSONString(),
        namespace: "webiny",
        onError: (error: Error) => {
            throw error;
        },
        nodes: [...WebinyNodes],
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
                    <OnChangePlugin onChange={handleOnChange} />
                    <AutoFocusPlugin />
                    <LexicalAutoLinkPlugin />
                    <LinkPlugin />
                    <ClearEditorPlugin />
                    <CodeHighlightPlugin />
                    <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
                    <RichTextPlugin
                        contentEditable={
                            <div className="editor-scroller">
                                <div className="editor" ref={onRef}>
                                    <ContentEditable />
                                </div>
                            </div>
                        }
                        placeholder={placeholder}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <ClickableLinkPlugin />
                    {floatingAnchorElem && (
                        <HeadingToolbar anchorElem={floatingAnchorElem} />
                    )}
                </div>
            </LexicalComposer>
    );
};

export { HeadingLexicalEditor };

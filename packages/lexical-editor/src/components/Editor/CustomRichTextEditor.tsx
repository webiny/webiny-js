import React, { useRef, useState} from "react";
import {EditorStateJSONString, RichTextEditorTag} from "../../types";
import Placeholder from "~/ui/Placeholder";
import {getEmptyEditorStateJSONString} from "~/utils/getEmptyEditorStateJSONString";
import WebinyNodes from "~/nodes/webinyNodes";
import theme from "~/themes/webinyLexicalTheme";
import {EditorState} from "lexical/LexicalEditorState";
import {LexicalEditor} from "lexical";
import {LexicalComposer} from "@lexical/react/LexicalComposer";
import {OnChangePlugin} from "@lexical/react/LexicalOnChangePlugin";
import {AutoFocusPlugin} from "@lexical/react/LexicalAutoFocusPlugin";
import {ClearEditorPlugin} from "@lexical/react/LexicalClearEditorPlugin";
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin";
import ContentEditable from "~/ui/ContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import {Toolbar} from "~/components/Toolbar/Toolbar";
import { makeComposable } from "@webiny/react-composition";

export interface CustomTextEditorProps  {
    /**
     * @description Define your custom type name for the toolbar.
     * Note: In AddToolbarAction composable component specify the type so action can be added to this toolbar
     */
    toolbarType: string,
    /**
     * @description Specify the html tag that this editor and toolbar action will be visible.
     */
    tag: RichTextEditorTag,
    onChange?: (json: EditorStateJSONString) => void;
    value: EditorStateJSONString | undefined | null;
    /**
     * @description Lexical plugins
     */
    children?: React.ReactNode;
    placeholderText?: string;
}

const CustomTextEditor: React.FC<CustomTextEditorProps> = ({ toolbarType, onChange, value, placeholderText, children }: CustomTextEditorProps) => {
    const placeholderElemText = placeholderText ?? "Enter some heading text...";
    const placeholderElem = <Placeholder>{placeholderElemText}</Placeholder>;
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
                <ClearEditorPlugin />
                {children}
                <RichTextPlugin
                    contentEditable={
                        <div className="editor-scroller">
                            <div className="editor" ref={onRef}>
                                <ContentEditable />
                            </div>
                        </div>
                    }
                    placeholder={placeholderElem}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                {floatingAnchorElem && (
                    <Toolbar type={toolbarType} anchorElem={document.body} />
                )}
            </div>
        </LexicalComposer>
    );
}

/**
 * @description Main editor container
 */
export const CustomRichTextEditor = makeComposable<CustomTextEditorProps>(
    "CustomRichTextEditor",
    (props): JSX.Element | null => {
       return <CustomTextEditor {...props} />
    }
);

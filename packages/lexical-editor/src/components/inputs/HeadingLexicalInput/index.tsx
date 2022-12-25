/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import ClickableLinkPlugin from "../../../plugins/ClickableLinkPlugin";
import { $generateHtmlFromNodes } from "@lexical/html";
import React from "react";

import ContentEditable from "../../../ui/ContentEditable";
import theme from "../../../themes/webinyLexicalTheme";
import Placeholder from "../../../ui/Placeholder";
import { EditorState } from "lexical/LexicalEditorState";
// import {$createHeadingNode} from '@lexical/rich-text';
import { $getRoot, $createTextNode, LexicalEditor } from "lexical";
import WebinyNodes from "../../../nodes/webinyNodes";
import { $createParagraphNode } from "lexical";
import { HeadingToolbar } from "~/components/inputs/HeadingLexicalInput/Toolbar";
import CodeHighlightPlugin from "~/plugins/CodeHighlightPlugin/CodeHighlightPlugin";
import FloatingLinkEditorPlugin from "~/plugins/FloatingLinkEditorPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalAutoLinkPlugin } from "~/plugins/AutoLinkPlugin";

interface HeadingLexicalInputProps {
    tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    onChange?: (htmlString: string) => void;
    value?: string;
}

function setText() {
    const root = $getRoot();
    if (root.getFirstChild() === null) {
        const p = $createParagraphNode();
        const text = $createTextNode("Welcome to the playground");
        p.append(text);
        root.append(p);
    }
}

const HeadingLexicalInput: React.FC<HeadingLexicalInputProps> = ({ onChange }) => {
    const text = "Enter some heading text...";
    const placeholder = <Placeholder>{text}</Placeholder>;
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
        editorState: setText,
        namespace: "webiny",
        onError: (error: Error) => {
            throw error;
        },
        nodes: [...WebinyNodes],
        theme: theme
    };

    // When the editor changes, you can get notified via the
    // LexicalOnChangePlugin!
    //TODO: remove all comments when data flow task is finished
    function handleOnChange(editorState: EditorState, editor: LexicalEditor) {
        // json
        // console.log(editorState.toJSON());
        editorState.read(() => {
            if (typeof onChange === "function") {
                // Read the contents of the EditorState here.
                // as html string
                const htmlString = $generateHtmlFromNodes(editor);
                console.log(htmlString);
                onChange(htmlString);
            }
            //const root = $getRoot();
            // console.log("ROOT", root);

            //const selection = $getSelection();
            //console.log("SELECTION", selection);
        });
    }

    return (
        <h1 data-marker="styles" style={{ fontSize: 24, color: "red" }}>
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
        </h1>
    );
};

export { HeadingLexicalInput };

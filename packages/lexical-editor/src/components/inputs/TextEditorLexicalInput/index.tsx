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

// import ComponentPickerPlugin from '../../../plugins/ComponentPickerPlugin';
import FloatingLinkEditorPlugin from "../../../plugins/FloatingLinkEditorPlugin";

import ContentEditable from "../../../ui/ContentEditable";
import theme from "../../../themes/webinyLexicalTheme";
import Placeholder from "../../../ui/Placeholder";
import { EditorState } from "lexical/LexicalEditorState";
import { LexicalEditor } from "lexical";

interface TextEditorLexicalInput {
    onChange?: (htmlString: string) => void;
    value?: string;
}

const TextEditorLexicalInput: React.FC<TextEditorLexicalInput> = ({ onChange }) => {
    const text = "Enter some text...";
    const placeholder = <Placeholder>{text}</Placeholder>;
    const scrollRef = useRef(null);
    const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

    const onRef = (_floatingAnchorElem: HTMLDivElement) => {
        if (_floatingAnchorElem !== null) {
            setFloatingAnchorElem(_floatingAnchorElem);
        }
    };

    const initialConfig = {
        namespace: "webiny",
        onError: (error: Error) => {
            throw error;
        },
        nodes: [],
        theme: theme
    };

    // When the editor changes, you can get notified via the
    // LexicalOnChangePlugin!
    function handleOnChange(editorState: EditorState, editor: LexicalEditor) {
        // json
        console.log(editorState.toJSON());
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
        <LexicalComposer initialConfig={initialConfig}>
            <div className="editor-container" ref={scrollRef}>
                <OnChangePlugin onChange={handleOnChange} />
                <AutoFocusPlugin />
                <ClearEditorPlugin />
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
                    <>
                        <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
                    </>
                )}
            </div>
        </LexicalComposer>
    );
};

export { TextEditorLexicalInput };

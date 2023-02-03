import React from "react";
import { Klass, LexicalNode } from "lexical";
import { EditorStateJSONString } from "~/types";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { getEmptyEditorStateJSONString } from "~/utils/getEmptyEditorStateJSONString";
import { WebinyNodes } from "~/nodes/webinyNodes";
import { theme } from "~/themes/webinyLexicalTheme";
import { isValidJSON } from "~/utils/isValidJSON";

interface RenderLexicalContent {
    nodes?: Klass<LexicalNode>[];
    value: EditorStateJSONString;
}
export const RenderLexicalContent: React.FC<RenderLexicalContent> = ({ nodes, value }) => {
    console.log("RenderLexicalContent", value);
    const initialConfig = {
        editorState: isValidJSON(value) ? value : getEmptyEditorStateJSONString(),
        namespace: "webiny",
        onError: (error: Error) => {
            throw error;
        },
        editable: false,
        nodes: [...WebinyNodes, ...(nodes || [])],
        theme: theme
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
                contentEditable={
                    <div className="editor">
                        <ContentEditable />
                    </div>
                }
                placeholder={""}
                ErrorBoundary={LexicalErrorBoundary}
            />
        </LexicalComposer>
    );
};

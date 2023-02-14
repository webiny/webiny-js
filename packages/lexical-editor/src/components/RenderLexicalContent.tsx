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
import { isValidLexicalData } from "~/utils/isValidLexicalData";

interface RenderLexicalContent {
    nodes?: Klass<LexicalNode>[];
    value: EditorStateJSONString;
}
export const RenderLexicalContent: React.FC<RenderLexicalContent> = ({ nodes, value }) => {
    const initialConfig = {
        editorState: isValidLexicalData(value) ? value : getEmptyEditorStateJSONString(),
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
                ErrorBoundary={LexicalErrorBoundary}
             placeholder={null}/>
        </LexicalComposer>
    );
};

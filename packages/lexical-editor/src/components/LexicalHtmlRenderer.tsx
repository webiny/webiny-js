import React from "react";
import { EditorStateJSONString } from "~/types";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { getEmptyEditorStateJSONString } from "~/utils/getEmptyEditorStateJSONString";
import { WebinyNodes } from "~/nodes/webinyNodes";
import { theme } from "~/themes/webinyLexicalTheme";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { LexicalUpdateStatePlugin } from "~/plugins/LexicalUpdateStatePlugin";
import { Klass, LexicalNode } from "lexical";

interface LexicalHtmlRendererProps {
    nodes?: Klass<LexicalNode>[];
    value: EditorStateJSONString | null;
}

export const LexicalHtmlRenderer: React.FC<LexicalHtmlRendererProps> = ({ nodes, value }) => {
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
                placeholder={null}
            />
            <LexicalUpdateStatePlugin value={value} />
        </LexicalComposer>
    );
};

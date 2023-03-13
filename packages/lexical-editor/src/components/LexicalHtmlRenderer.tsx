import React from "react";
import { LexicalValue } from "~/types";
import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { generateInitialLexicalValue } from "~/utils/generateInitialLexicalValue";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { LexicalUpdateStatePlugin } from "~/plugins/LexicalUpdateStatePlugin";
import { Klass, LexicalNode } from "lexical";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { WebinyNodes } from "~/nodes/webinyNodes";
import { webinyLexicalTheme } from "~/themes/webinyLexicalTheme";

interface LexicalHtmlRendererProps {
    nodes?: Klass<LexicalNode>[];
    value: LexicalValue | null;
}

export const LexicalHtmlRenderer: React.FC<LexicalHtmlRendererProps> = ({ nodes, value }) => {
    const { theme } = usePageElements();
    const initialConfig = {
        editorState: isValidLexicalData(value) ? value : generateInitialLexicalValue(),
        namespace: "webiny",
        onError: (error: Error) => {
            throw error;
        },
        editable: false,
        nodes: [...WebinyNodes, ...(nodes || [])],
        theme: { ...webinyLexicalTheme, styles: theme.styles }
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

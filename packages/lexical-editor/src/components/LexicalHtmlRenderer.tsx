import React, { useRef } from "react";
import type { Klass, LexicalNode } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary.js";
import { allNodes } from "@webiny/lexical-nodes";
import type { EditorTheme } from "@webiny/lexical-theme";
import type { LexicalValue } from "~/types.js";
import { RichTextEditorProvider } from "~/context/RichTextEditorContext.js";
import { StateHandlingPlugin } from "~/plugins/StateHandlingPlugin.js";

interface LexicalHtmlRendererProps {
    nodes?: Klass<LexicalNode>[];
    value: LexicalValue | null;
    theme: EditorTheme;
}

export const LexicalHtmlRenderer = ({ nodes, value, ...props }: LexicalHtmlRendererProps) => {
    const theme: EditorTheme = props.theme;
    const editorTheme = useRef(theme);

    const initialConfig = {
        editorState: null,
        namespace: "webiny",
        onError: () => {
            // Ignore errors. We don't want to break the app because of errors caused by config/value updates.
            // These are usually resolved in the next component render cycle.
        },
        editable: false,
        nodes: [...allNodes, ...(nodes || [])],
        theme: {
            ...editorTheme.current.tokens,
            // I'm not aware of a better way to pass custom data to nodes.
            // For now, we're using Lexical's theme to pass colors and typography.
            $colors: editorTheme.current.colors,
            $typography: editorTheme.current.typography,
            $cacheKey: JSON.stringify(editorTheme.current)
        }
    };

    return (
        <LexicalComposer initialConfig={initialConfig} key={initialConfig.nodes.length}>
            <RichTextEditorProvider theme={theme}>
                <RichTextPlugin
                    contentEditable={
                        <div className="editor">
                            <ContentEditable />
                        </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                    placeholder={null}
                />
                <StateHandlingPlugin value={value} />
            </RichTextEditorProvider>
        </LexicalComposer>
    );
};

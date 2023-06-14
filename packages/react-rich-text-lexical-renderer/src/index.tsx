import React from "react";
import { LexicalNode, LexicalValue, Klass } from "@webiny/lexical-editor/types";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor";
import { ThemeProvider, useTheme } from "@webiny/app-theme";

interface RichTextLexicalRenderer {
    value: LexicalValue | Record<string, any> | null;
    theme?: Record<string, any>;
    nodes?: Klass<LexicalNode>[];
}

const LexicalRenderer: React.FC<RichTextLexicalRenderer> = props => {
    const { theme } = useTheme();

    if (!props?.value) {
        return null;
    }

    // Lexical editor state expect string, check and stringify if value is object.
    const value = typeof props?.value === "string" ? props.value : JSON.stringify(props.value);
    return (
        <LexicalHtmlRenderer
            value={value}
            theme={{ ...theme, ...props?.theme }}
            nodes={props.nodes}
        />
    );
};

export const RichTextLexicalRenderer: React.FC<RichTextLexicalRenderer> = props => {
    return (
        <ThemeProvider>
            <LexicalRenderer {...props} />
        </ThemeProvider>
    );
};

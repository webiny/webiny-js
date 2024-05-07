import React, { useMemo } from "react";
import { LexicalNode, LexicalValue, Klass } from "@webiny/lexical-editor/types";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor";
import { ThemeProvider, useTheme } from "@webiny/app-theme";

type RendererLexicalValue = LexicalValue | Record<string, any> | null | undefined;

interface RichTextLexicalRenderer {
    value: RendererLexicalValue;
    theme?: Record<string, any>;
    nodes?: Klass<LexicalNode>[];
}

const LexicalRenderer = (props: RichTextLexicalRenderer) => {
    const { theme } = useTheme();

    const getValue = (value: RendererLexicalValue): string | null => {
        if (!value) {
            return null;
        }
        return typeof props?.value === "string" ? props.value : JSON.stringify(props.value);
    };

    const rendererTheme = useMemo(() => {
        return { ...props?.theme, ...theme };
    }, [props?.theme, theme]);

    return (
        <LexicalHtmlRenderer
            value={getValue(props?.value)}
            theme={rendererTheme}
            nodes={props.nodes}
        />
    );
};

export const RichTextLexicalRenderer = (props: RichTextLexicalRenderer) => {
    return (
        <ThemeProvider>
            <LexicalRenderer {...props} />
        </ThemeProvider>
    );
};

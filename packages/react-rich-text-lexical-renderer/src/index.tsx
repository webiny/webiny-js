import React from "react";
import type { Klass, LexicalNode, LexicalValue } from "@webiny/lexical-editor/types.js";
import type { EditorTheme } from "@webiny/lexical-theme";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor";

type RendererLexicalValue = LexicalValue | Record<string, any> | null | undefined;

interface RichTextLexicalRenderer {
    value: RendererLexicalValue;
    theme: EditorTheme;
    nodes?: Klass<LexicalNode>[];
}

const LexicalRenderer = (props: RichTextLexicalRenderer) => {
    const getValue = (value: RendererLexicalValue): string | null => {
        if (!value) {
            return null;
        }
        return typeof props?.value === "string" ? props.value : JSON.stringify(props.value);
    };

    return (
        <LexicalHtmlRenderer
            value={getValue(props?.value)}
            theme={props.theme}
            nodes={props.nodes}
        />
    );
};

export const RichTextLexicalRenderer = (props: RichTextLexicalRenderer) => {
    return <LexicalRenderer {...props} />;
};

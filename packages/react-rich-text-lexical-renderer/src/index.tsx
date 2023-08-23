import React from "react";
import { Klass, LexicalNode, LexicalValue } from "@webiny/lexical-editor/types";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor";
import { theme } from "./theme";
import { assignStyles } from "~/utils";

type RendererLexicalValue = LexicalValue | Record<string, any> | null | undefined;

interface RichTextLexicalRenderer {
    value: RendererLexicalValue;
    theme?: Record<string, any>;
    nodes?: Klass<LexicalNode>[];
}

const LexicalRenderer: React.FC<RichTextLexicalRenderer> = props => {
    const getValue = (value: RendererLexicalValue): string | null => {
        if (!value) {
            return null;
        }
        return typeof props?.value === "string" ? props.value : JSON.stringify(props.value);
    };

    return (
        <LexicalHtmlRenderer
            value={getValue(props?.value)}
            theme={{ ...theme, ...props?.theme }}
            nodes={props.nodes}
            themeStylesTransformer={styles => {
                return assignStyles({
                    breakpoints: theme.breakpoints,
                    styles
                });
            }}
        />
    );
};

export const RichTextLexicalRenderer: React.FC<RichTextLexicalRenderer> = props => {
    return <LexicalRenderer {...props} />;
};

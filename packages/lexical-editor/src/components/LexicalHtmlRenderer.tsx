import React, { createElement } from "react";
import { EditorStateJSONString } from "~/types";
import { useLexicalNodesToHtmlGenerator } from "~/hooks/useLexicalNodesToHtmlGenerator";

interface LexicalHtmlRendererProps {
    tag?: string;
    editorState: EditorStateJSONString | null;
}

export const LexicalHtmlRenderer: React.FC<LexicalHtmlRendererProps> = ({ tag, editorState }) => {
    const { html } = useLexicalNodesToHtmlGenerator(editorState);
    return createElement(tag || "div", {
        dangerouslySetInnerHTML: { __html: html }
    });
};

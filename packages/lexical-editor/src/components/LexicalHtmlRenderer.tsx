import React, { createElement } from "react";
import { EditorStateJSONString } from "~/types";
import { useLexicalNodesToHtmlGenerator } from "~/hooks/useLexicalNodesToHtmlGenerator";

interface LexicalHtmlRendererProps {
    tag?: string;
    value: EditorStateJSONString | null;
}

export const LexicalHtmlRenderer: React.FC<LexicalHtmlRendererProps> = ({ tag, value }) => {
    const { html } = useLexicalNodesToHtmlGenerator(value);
    return createElement(tag || "div", {
        dangerouslySetInnerHTML: { __html: html }
    });
};

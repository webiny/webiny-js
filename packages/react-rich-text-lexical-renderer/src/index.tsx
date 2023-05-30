import React from "react";
import {LexicalNode, LexicalValue, Klass} from "@webiny/lexical-editor/types";
import {LexicalHtmlRenderer} from "@webiny/lexical-editor";
import {usePageElements} from "@webiny/app-page-builder-elements";

interface RichTextLexicalRenderer {
    value: LexicalValue | null;
    theme: Record<string, any>;
    nodes?: Klass<LexicalNode>[];
}

export const RichTextLexicalRenderer: React.FC<RichTextLexicalRenderer> = props => {
    const { theme } = usePageElements();
    return <LexicalHtmlRenderer value={props.value}
                                theme={{...theme, ...props.theme }}
                                nodes={props.nodes} />
};

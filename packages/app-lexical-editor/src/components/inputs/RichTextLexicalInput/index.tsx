import { SerializedLexicalNode } from "lexical";
import React from "react";

export interface RichTextLexicalInputProps {
    content: SerializedLexicalNode;
    styles?: Record<any, unknown>;
}

const RichTextLexicalInput: React.FC<RichTextLexicalInputProps> = () => {
    return <div>RichTextLexicalInput</div>;
};

export { RichTextLexicalInput };

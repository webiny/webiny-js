import { TextEditorLexicalInput } from "@webiny/app-lexical-editor";
import React from "react";

interface ReactLexicalEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    onSelect?: () => void;
    tag?: string | [string, Record<string, any>];
}

const TextLexicalEditor: React.FC<ReactLexicalEditorProps> = () => {
    return <TextEditorLexicalInput />;
};

export default React.memo(TextLexicalEditor);

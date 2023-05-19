import React from "react";
import { ParagraphEditor } from "@webiny/lexical-editor";
import { LexicalValue } from "@webiny/lexical-editor/types";
import { usePageElements } from "@webiny/app-page-builder-elements";

interface LexicalEditorProps {
    value: LexicalValue;
    focus?: boolean;
    onChange?: (value: LexicalValue) => void;
    onBlur?: (editorState: LexicalValue) => void;
    height?: number | string;
    width?: number | string;
}

export const LexicalParagraphEditor: React.FC<LexicalEditorProps> = ({
    value,
    onChange,
    ...rest
}) => {
    const { theme } = usePageElements();
    return <ParagraphEditor theme={theme} value={value} onChange={onChange} {...rest} />;
};

import React from "react";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";
import { Toolbar } from "~/components/Toolbar/Toolbar";

interface ParagraphLexicalEditorProps extends RichTextEditorProps {
    tag?: "p";
}

const ParagraphEditor: React.FC<ParagraphLexicalEditorProps> = ({ placeholder, tag, ...rest }) => {
    return (
        <RichTextEditor
            toolbar={<Toolbar />}
            tag={tag ?? "p"}
            placeholder={placeholder ?? "Enter your text here..."}
            {...rest}
            styles={{ padding: 5 }}
        >
            {rest?.children}
        </RichTextEditor>
    );
};

export { ParagraphEditor };

import React from "react";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";
import { Toolbar } from "~/components/Toolbar/Toolbar";

interface ParagraphLexicalEditorProps extends RichTextEditorProps {
    tag?: "p";
}

const styles = { padding: 5 };

const ParagraphEditor = ({ placeholder, tag, ...rest }: ParagraphLexicalEditorProps) => {
    return (
        <RichTextEditor
            toolbar={<Toolbar />}
            tag={tag ?? "p"}
            placeholder={placeholder ?? "Enter your text here..."}
            {...rest}
            styles={styles}
        >
            {rest?.children}
        </RichTextEditor>
    );
};

export { ParagraphEditor };

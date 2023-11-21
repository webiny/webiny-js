import React from "react";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";
import { Toolbar } from "~/components/Toolbar/Toolbar";

interface HeadingEditorProps extends RichTextEditorProps {
    tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const HeadingEditor: React.FC<HeadingEditorProps> = ({ tag, placeholder, ...rest }) => {
    return (
        <RichTextEditor
            toolbar={<Toolbar />}
            tag={tag ?? "h1"}
            placeholder={placeholder ?? "Enter your heading text here..."}
            {...rest}
            styles={{ padding: 5 }}
        >
            {rest?.children}
        </RichTextEditor>
    );
};

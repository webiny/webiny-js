import React from "react";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";
import { Toolbar } from "~/components/Toolbar/Toolbar";
import { EnsureHeadingTagPlugin } from "~/components/Editor/EnsureHeadingTagPlugin";

interface HeadingEditorProps extends RichTextEditorProps {
    tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const styles = { padding: 5 };

export const HeadingEditor = ({ tag, placeholder, ...rest }: HeadingEditorProps) => {
    return (
        <RichTextEditor
            toolbar={<Toolbar />}
            tag={tag ?? "h1"}
            placeholder={placeholder ?? "Enter your heading text here..."}
            {...rest}
            styles={styles}
        >
            <EnsureHeadingTagPlugin />
            {rest?.children}
        </RichTextEditor>
    );
};

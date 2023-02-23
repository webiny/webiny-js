import React from "react";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ClickableLinkPlugin } from "~/plugins/ClickableLinkPlugin/ClickableLinkPlugin";
import { FloatingLinkEditorPlugin } from "~/plugins/FloatingLinkEditorPlugin/FloatingLinkEditorPlugin";
import { HeadingToolbar } from "~/components/Toolbar/HeadingToolbar";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";

interface HeadingEditorProps extends RichTextEditorProps {
    tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const HeadingEditor: React.FC<HeadingEditorProps> = ({ tag, placeholder, ...rest }) => {
    return (
        <RichTextEditor
            toolbar={<HeadingToolbar />}
            tag={tag ?? "h1"}
            placeholder={placeholder ?? "Enter your heading text here..."}
            {...rest}
        >
            <LinkPlugin />
            <ClickableLinkPlugin />
            <FloatingLinkEditorPlugin anchorElem={document.body} />
        </RichTextEditor>
    );
};

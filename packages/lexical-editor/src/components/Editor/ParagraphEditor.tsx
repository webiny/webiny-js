import React from "react";
import { CodeHighlightPlugin } from "~/plugins/CodeHighlightPlugin/CodeHighlightPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { FloatingLinkEditorPlugin } from "~/plugins/FloatingLinkEditorPlugin/FloatingLinkEditorPlugin";
import { ClickableLinkPlugin } from "~/plugins/ClickableLinkPlugin/ClickableLinkPlugin";
import { ParagraphToolbar } from "~/components/Toolbar/ParagraphToolbar";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";
import { WebinyListPlugin } from "~/plugins/WebinyListPLugin/WebinyListPlugin";

interface ParagraphLexicalEditorProps extends RichTextEditorProps {
    tag?: "p";
}
const ParagraphEditor: React.FC<ParagraphLexicalEditorProps> = ({
    toolbar,
    placeholder,
    tag,
    ...rest
}) => {
    return (
        <RichTextEditor
            toolbar={toolbar || <ParagraphToolbar />}
            tag={tag ?? "p"}
            placeholder={placeholder ?? "Enter your text here..."}
            {...rest}
        >
            <LinkPlugin />
            <WebinyListPlugin />
            <CodeHighlightPlugin />
            <ClickableLinkPlugin />
            <FloatingLinkEditorPlugin anchorElem={document.body} />
        </RichTextEditor>
    );
};

export { ParagraphEditor };

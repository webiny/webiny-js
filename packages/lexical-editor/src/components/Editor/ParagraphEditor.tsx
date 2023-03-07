import React from "react";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CodeHighlightPlugin } from "~/plugins/CodeHighlightPlugin/CodeHighlightPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { FloatingLinkEditorPlugin } from "~/plugins/FloatingLinkEditorPlugin/FloatingLinkEditorPlugin";
import { ClickableLinkPlugin } from "~/plugins/ClickableLinkPlugin/ClickableLinkPlugin";
import { ParagraphToolbar } from "~/components/Toolbar/ParagraphToolbar";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";

interface ParagraphLexicalEditorProps extends RichTextEditorProps {
    tag?: "p";
}

const ParagraphEditor: React.FC<ParagraphLexicalEditorProps> = ({ placeholder, tag, ...rest }) => {
    return (
        <RichTextEditor
            toolbar={<ParagraphToolbar />}
            tag={tag ?? "p"}
            placeholder={placeholder ?? "Enter your text here..."}
            {...rest}
        >
            <LinkPlugin />
            <CodeHighlightPlugin />
            <ClickableLinkPlugin />
            <FloatingLinkEditorPlugin anchorElem={document.body} />
            <ListPlugin />
        </RichTextEditor>
    );
};

export { ParagraphEditor };

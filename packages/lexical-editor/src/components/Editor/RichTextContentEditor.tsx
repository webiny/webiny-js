import React from "react";
import { CodeHighlightPlugin } from "~/plugins/CodeHighlightPlugin/CodeHighlightPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { FloatingLinkEditorPlugin } from "~/plugins/FloatingLinkEditorPlugin/FloatingLinkEditorPlugin";
import { ClickableLinkPlugin } from "~/plugins/ClickableLinkPlugin/ClickableLinkPlugin";
import { ParagraphToolbar } from "~/components/Toolbar/ParagraphToolbar";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";
import { WebinyListPlugin } from "~/plugins/WebinyListPLugin/WebinyListPlugin";
import {RichTextStaticToolbar} from "~/components/Toolbar/RichTextStaticToolbar";

interface RichTextContentEditorProps extends RichTextEditorProps {
    tag?: "p";
}

const RichTextContentEditor: React.FC<RichTextContentEditorProps> = ({ placeholder, tag, ...rest }) => {
    return (
        <RichTextEditor
            staticToolbar={<RichTextStaticToolbar />}
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

export { RichTextContentEditor };

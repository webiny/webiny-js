import React from "react";
import { CodeHighlightPlugin } from "~/plugins/CodeHighlightPlugin/CodeHighlightPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { FloatingLinkEditorPlugin } from "~/plugins/FloatingLinkEditorPlugin/FloatingLinkEditorPlugin";
import { ClickableLinkPlugin } from "~/plugins/ClickableLinkPlugin/ClickableLinkPlugin";
import { RichTextEditor, RichTextEditorProps } from "~/components/Editor/RichTextEditor";
import { WebinyListPlugin } from "~/plugins/WebinyListPLugin/WebinyListPlugin";
import { RichTextStaticToolbar } from "~/components/Toolbar/RichTextStaticToolbar";

interface RichTextContentEditorProps extends RichTextEditorProps {
    tag?: "p";
    toolbarActionPlugins?: { type: string; plugin: Record<string, any> }[];
}

const RichTextContentEditor: React.FC<RichTextContentEditorProps> = ({
    placeholder,
    toolbarActionPlugins,
    tag,
    ...rest
}) => {
    return (
        <RichTextEditor
            staticToolbar={<RichTextStaticToolbar actionPlugins={toolbarActionPlugins} />}
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

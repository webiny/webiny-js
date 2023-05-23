import React from "react";
import {
    ClickableLinkPlugin,
    CodeHighlightPlugin,
    FloatingLinkEditorPlugin,
    RichTextEditor,
    RichTextEditorProps,
    WebinyListPlugin,
    LinkPlugin
} from "@webiny/lexical-editor";
import {RichTextStaticToolbar} from "~/components/RichTextStaticToolbar";
import webinyTheme from "theme/theme";

interface RichTextContentEditorProps extends RichTextEditorProps {
    tag?: "p";
    toolbarActionPlugins?: { type: string; plugin: Record<string, any> }[];
}

const LexicalRichTextEditor: React.FC<RichTextContentEditorProps> = ({
    placeholder,
    staticToolbar,
    toolbarActionPlugins,
    theme,
    tag,
    ...rest
}) => {
    return (
        <RichTextEditor
            theme={theme || webinyTheme}
            staticToolbar={
                staticToolbar || <RichTextStaticToolbar actionPlugins={toolbarActionPlugins} />
            }
            tag={tag ?? "p"}
            placeholder={placeholder ?? "Enter your text here..."}
            {...rest}
        >
            <LinkPlugin />
            <WebinyListPlugin />
            <CodeHighlightPlugin />
            <ClickableLinkPlugin />
            {/* eslint-disable-next-line react/jsx-no-undef */}
            <FloatingLinkEditorPlugin anchorElem={document.body} />
        </RichTextEditor>
    );
};

export { LexicalRichTextEditor };

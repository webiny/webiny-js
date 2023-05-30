import React from "react";
import {
    RichTextEditor,
    RichTextEditorProps
} from "@webiny/lexical-editor/components/Editor/RichTextEditor";
import { WebinyListPlugin } from "@webiny/lexical-editor/plugins/WebinyListPLugin/WebinyListPlugin";
import {
    ClickableLinkPlugin,
    CodeHighlightPlugin,
    FloatingLinkEditorPlugin,
    LinkPlugin
} from "@webiny/lexical-editor";
import { usePageElements } from "@webiny/app-page-builder-elements";
import { RichTextStaticToolbar } from "~/components/RichTextStaticToolbar";

interface RichTextContentEditorProps extends Omit<RichTextEditorProps, "theme"> {
    tag?: "p";
    toolbarActionPlugins?: { type: string; plugin: Record<string, any> }[];
    theme?: Record<string, any>;
}

export const LexicalCmsEditor: React.FC<RichTextContentEditorProps> = ({
    placeholder,
    toolbarActionPlugins,
    tag,
    ...rest
}) => {
    const { theme } = usePageElements();
    return (
        <RichTextEditor
            staticToolbar={<RichTextStaticToolbar actionPlugins={toolbarActionPlugins} />}
            tag={tag ?? "p"}
            placeholder={placeholder ?? "Enter your text here..."}
            {...rest}
            theme={theme}
        >
            <LinkPlugin />
            <WebinyListPlugin />
            <CodeHighlightPlugin />
            <ClickableLinkPlugin />
            <FloatingLinkEditorPlugin anchorElem={document.body} />
        </RichTextEditor>
    );
};

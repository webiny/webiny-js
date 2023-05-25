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
import { RichTextStaticToolbar } from "~/components/RichTextStaticToolbar";
import webinyTheme from "theme/theme";
import { LexicalValue } from "@webiny/lexical-editor/types";

interface LexicalRichTextEditorProps
    extends Omit<RichTextEditorProps, "theme" | "onChange" | "value"> {
    tag?: "p";
    theme?: {};
    value: Record<string, any> | null;
    onChange: (json: Record<string, any>) => void;
    toolbarActionPlugins?: { type: string; plugin: Record<string, any> }[];
}

const LexicalRichTextEditor: React.FC<LexicalRichTextEditorProps> = ({
    placeholder,
    staticToolbar,
    toolbarActionPlugins,
    theme,
    tag,
    onChange,
    value,
    ...rest
}) => {
    const hasThemeValue = (theme?: Record<string, any>): boolean => {
        return !!theme && Object.keys(theme).length > 0;
    };

    return (
        <RichTextEditor
            value={value ? JSON.stringify(value) : null}
            onChange={(value: LexicalValue) => {
                onChange(JSON.parse(value));
            }}
            theme={theme && hasThemeValue(theme) ? theme : webinyTheme}
            staticToolbar={<RichTextStaticToolbar actionPlugins={toolbarActionPlugins} />}
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

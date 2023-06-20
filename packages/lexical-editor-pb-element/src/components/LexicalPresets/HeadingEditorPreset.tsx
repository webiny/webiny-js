import React from "react";
import {
    BoldAction,
    CodeHighlightAction,
    CodeHighlightPlugin,
    Divider,
    FloatingLinkEditorPlugin,
    FontColorAction,
    FontColorPlugin,
    FontSizeAction,
    ItalicAction,
    LinkAction,
    TextAlignmentAction,
    TypographyAction,
    TypographyPlugin,
    UnderlineAction,
    LexicalEditorConfig,
    LinkPlugin
} from "@webiny/lexical-editor";

const { ToolbarElement, Plugin } = LexicalEditorConfig;

export const HeadingEditorPreset = () => {
    return (
        <LexicalEditorConfig>
            <ToolbarElement name="fontSize" element={<FontSizeAction />} />
            <ToolbarElement name="fontColor" element={<FontColorAction />} />
            <ToolbarElement name="typography" element={<TypographyAction />} />
            <ToolbarElement name="textAlignment" element={<TextAlignmentAction />} />
            <ToolbarElement name="divider1" element={<Divider />} />
            <ToolbarElement name="bold" element={<BoldAction />} />
            <ToolbarElement name="italic" element={<ItalicAction />} />
            <ToolbarElement name="underline" element={<UnderlineAction />} />
            <ToolbarElement name="codeHighlight" element={<CodeHighlightAction />} />
            <ToolbarElement name="divider2" element={<Divider />} />
            <ToolbarElement name="link" element={<LinkAction />} />
            <Plugin name={"fontColor"} element={<FontColorPlugin />} />
            <Plugin name={"typography"} element={<TypographyPlugin />} />
            <Plugin name={"codeHighlight"} element={<CodeHighlightPlugin />} />
            <Plugin name={"link"} element={<LinkPlugin />} />
            <Plugin
                name={"floatingLinkEditor"}
                element={<FloatingLinkEditorPlugin anchorElem={document.body} />}
            />
            <Plugin name={"typography"} element={<TypographyPlugin />} />
        </LexicalEditorConfig>
    );
};

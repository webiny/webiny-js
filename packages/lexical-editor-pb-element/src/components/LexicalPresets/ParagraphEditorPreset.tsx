import React from "react";
import {
    BoldAction,
    BulletListAction,
    ClickableLinkPlugin,
    CodeHighlightAction,
    CodeHighlightPlugin,
    Divider,
    FloatingLinkEditorPlugin,
    FontColorAction,
    FontColorPlugin,
    FontSizeAction,
    ItalicAction,
    LinkAction,
    NumberedListAction,
    QuoteAction,
    QuotePlugin,
    TextAlignmentAction,
    TypographyAction,
    TypographyPlugin,
    UnderlineAction,
    ListPlugin,
    LexicalEditorConfig,
    LinkPlugin
} from "@webiny/lexical-editor";

const { ToolbarElement, Plugin } = LexicalEditorConfig;
export const ParagraphEditorPreset = () => {
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
            <ToolbarElement name="numberedList" element={<NumberedListAction />} />
            <ToolbarElement name="bulletList" element={<BulletListAction />} />
            <ToolbarElement name="divider3" element={<Divider />} />
            <ToolbarElement name="link" element={<LinkAction />} />
            <ToolbarElement name="quote" element={<QuoteAction />} />
            <Plugin name={"fontColor"} element={<FontColorPlugin />} />
            <Plugin name={"typography"} element={<TypographyPlugin />} />
            <Plugin name={"quote"} element={<QuotePlugin />} />
            <Plugin name={"list"} element={<ListPlugin />} />
            <Plugin name={"codeHighlight"} element={<CodeHighlightPlugin />} />
            <Plugin name={"link"} element={<LinkPlugin />} />
            <Plugin name={"clickableLink"} element={<ClickableLinkPlugin />} />
            <Plugin
                name={"floatingLinkEditor"}
                element={<FloatingLinkEditorPlugin anchorElem={document.body} />}
            />
            <Plugin name={"typography"} element={<TypographyPlugin />} />
        </LexicalEditorConfig>
    );
};

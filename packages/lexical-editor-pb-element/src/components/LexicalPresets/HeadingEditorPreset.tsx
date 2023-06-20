import React from "react";
import {
    BoldAction,
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
    TextAlignmentAction,
    TypographyAction,
    TypographyPlugin,
    UnderlineAction,
    LexicalEditorConfig,
    LinkPlugin
} from "@webiny/lexical-editor";

const { ToolbarElement, Plugin } = LexicalEditorConfig;
const HeadingToolbarPreset = () => {
    return (
        <>
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
            <ToolbarElement name="divider3" element={<Divider />} />
            <ToolbarElement name="link" element={<LinkAction />} />
        </>
    );
};

const HeadingPluginsPreset = () => {
    return (
        <>
            <Plugin name={"fontColor"} element={<FontColorPlugin />} />
            <Plugin name={"typography"} element={<TypographyPlugin />} />
            <Plugin name={"codeHighlight"} element={<CodeHighlightPlugin />} />
            <Plugin name={"link"} element={<LinkPlugin />} />
            <Plugin name={"clickableLink"} element={<ClickableLinkPlugin />} />
            <Plugin
                name={"floatingLinkEditor"}
                element={<FloatingLinkEditorPlugin anchorElem={document.body} />}
            />
            <Plugin name={"typography"} element={<TypographyPlugin />} />
        </>
    );
};

export const HeadingEditorPreset = () => {
    return (
        <LexicalEditorConfig>
            <HeadingToolbarPreset />
            <HeadingPluginsPreset />
        </LexicalEditorConfig>
    );
};

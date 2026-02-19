import React from "react";
import {
    TypographyAction,
    FontColorAction,
    Divider,
    BoldAction,
    ItalicAction,
    UnderlineAction,
    CodeHighlightAction,
    NumberedListAction,
    BulletListAction,
    LinkAction,
    QuoteAction,
    QuotePlugin,
    FloatingLinkEditorPlugin,
    LinkPlugin,
    ListPlugin,
    TypographyPlugin,
    FontColorPlugin,
    TextAlignmentAction
} from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/app-admin";
import { LexicalLinkForm } from "@webiny/app-admin";
import { LexicalEditorConfig } from "@webiny/lexical-editor";
import { TypographyDropDown } from "./TypographyDropDown.js";
import { ExpandEditorAction } from "./ExpandEditorAction.js";

const { ToolbarElement, Plugin } = LexicalEditorConfig;

const sharedPlugins = (
    <>
        <Plugin name={"fontColor"} element={<FontColorPlugin />} />
        <Plugin name={"list"} element={<ListPlugin />} />
        <Plugin name={"typography"} element={<TypographyPlugin />} />
        <Plugin name={"link"} element={<LinkPlugin />} />
        <Plugin name={"quote"} element={<QuotePlugin />} />
    </>
);

export const DefaultLexicalConfig = () => {
    return (
        <>
            <CompositionScope name={"compact"}>
                <LexicalEditorConfig priority={"primary"}>
                    {sharedPlugins}
                    <ToolbarElement name="textAlignment" element={<TextAlignmentAction />} />
                    <ToolbarElement name="boldAction" element={<BoldAction />} />
                    <ToolbarElement name="italic" element={<ItalicAction />} />
                    <ToolbarElement name="underline" element={<UnderlineAction />} />
                    <ToolbarElement name="expand" element={<ExpandEditorAction />} />
                </LexicalEditorConfig>
            </CompositionScope>
            <CompositionScope name={"expanded"}>
                <LexicalEditorConfig priority={"primary"}>
                    <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
                    {sharedPlugins}
                    <Plugin
                        name={"floatingLinkEditor"}
                        element={<FloatingLinkEditorPlugin LinkForm={LexicalLinkForm} />}
                    />
                    <ToolbarElement name="fontColor" element={<FontColorAction />} />
                    <ToolbarElement name="typography" element={<TypographyAction />} />
                    <ToolbarElement name="textAlignment" element={<TextAlignmentAction />} />
                    <ToolbarElement name="divider1" element={<Divider />} />
                    <ToolbarElement name="boldAction" element={<BoldAction />} />
                    <ToolbarElement name="italic" element={<ItalicAction />} />
                    <ToolbarElement name="underline" element={<UnderlineAction />} />
                    <ToolbarElement name="codeHighlight" element={<CodeHighlightAction />} />
                    <ToolbarElement name="divider2" element={<Divider />} />
                    <ToolbarElement name="numberedList" element={<NumberedListAction />} />
                    <ToolbarElement name="bulletList" element={<BulletListAction />} />
                    <ToolbarElement name="divider2" element={<Divider />} />
                    <ToolbarElement name="link" element={<LinkAction />} />
                    <ToolbarElement name="quote" element={<QuoteAction />} />
                </LexicalEditorConfig>
            </CompositionScope>
        </>
    );
};

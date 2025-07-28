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
    ImageAction,
    LinkAction,
    QuoteAction,
    ImagesPlugin,
    QuotePlugin,
    FloatingLinkEditorPlugin,
    LinkPlugin,
    ListPlugin,
    TypographyPlugin,
    FontColorPlugin,
    TextAlignmentAction
} from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/app-admin";
import { LexicalEditorConfig } from "@webiny/lexical-editor";
import { TypographyDropDown } from "./TypographyDropDown";
import { ExpandEditorAction } from "./ExpandEditorAction";
import { LinkEditForm } from "./LinkEditForm";

const { ToolbarElement, Plugin } = LexicalEditorConfig;

const sharedPlugins = (
    <>
        <Plugin name={"fontColor"} element={<FontColorPlugin />} />
        <Plugin name={"list"} element={<ListPlugin />} />
        <Plugin name={"typography"} element={<TypographyPlugin />} />
        <Plugin name={"link"} element={<LinkPlugin />} />
        <Plugin
            name={"floatingLinkEditor"}
            element={
                <FloatingLinkEditorPlugin
                    anchorElem={() => document.body}
                    LinkEditForm={LinkEditForm}
                />
            }
        />
        <Plugin name={"images"} element={<ImagesPlugin />} />
        <Plugin name={"quote"} element={<QuotePlugin />} />
    </>
);

export const DefaultLexicalConfig = () => {
    return (
        <>
            <CompositionScope name={"compact"}>
                <LexicalEditorConfig>
                    {sharedPlugins}
                    <ToolbarElement name="textAlignment" element={<TextAlignmentAction />} />
                    <ToolbarElement name="boldAction" element={<BoldAction />} />
                    <ToolbarElement name="italic" element={<ItalicAction />} />
                    <ToolbarElement name="underline" element={<UnderlineAction />} />
                    <ToolbarElement name="expand" element={<ExpandEditorAction />} />
                </LexicalEditorConfig>
            </CompositionScope>
            <CompositionScope name={"expanded"}>
                <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
                <LexicalEditorConfig>
                    {sharedPlugins}
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
                    <ToolbarElement name="divider" element={<Divider />} />
                    <ToolbarElement name="image" element={<ImageAction />} />
                    <ToolbarElement name="divider3" element={<Divider />} />
                    <ToolbarElement name="link" element={<LinkAction />} />
                    <ToolbarElement name="quote" element={<QuoteAction />} />
                </LexicalEditorConfig>
            </CompositionScope>
        </>
    );
};

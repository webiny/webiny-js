import React from "react";
import {
    TypographyAction,
    FontColorAction,
    FontSizeAction,
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
    TextAlignmentAction,
    LexicalEditorConfig as BaseConfig
} from "@webiny/lexical-editor";
import { LexicalLinkForm } from "@webiny/app-admin";
import { TypographyDropDown } from "./TypographyDropDown.js";
import { ExpandEditorAction } from "./ExpandEditorAction.js";

const { ToolbarElement, Plugin } = BaseConfig;

// The plugins every toolbar's buttons rely on.
const SharedPlugins = () => (
    <>
        <Plugin name={"fontColor"} element={<FontColorPlugin />} />
        <Plugin name={"list"} element={<ListPlugin />} />
        <Plugin name={"typography"} element={<TypographyPlugin />} />
        <Plugin name={"link"} element={<LinkPlugin />} />
        <Plugin name={"quote"} element={<QuotePlugin />} />
    </>
);

/**
 * The compact editor's toolbar contents: alignment, bold, italic, underline and the button that
 * opens the expanded editor. Contents only; the scope picks the container.
 */
export const CompactToolbar = () => {
    return (
        <BaseConfig priority={"primary"}>
            <SharedPlugins />
            <ToolbarElement name="textAlignment" element={<TextAlignmentAction />} />
            <ToolbarElement name="boldAction" element={<BoldAction />} />
            <ToolbarElement name="italic" element={<ItalicAction />} />
            <ToolbarElement name="underline" element={<UnderlineAction />} />
            <ToolbarElement name="expand" element={<ExpandEditorAction />} />
        </BaseConfig>
    );
};

/**
 * The expanded editor's toolbar contents: the buttons, and what they need (their plugins, the
 * link form, the theme's typography drop-down). Contents only; the scope picks the container
 * (`LexicalEditorConfig.StaticToolbar` or `.FloatingToolbar`).
 */
export const ExpandedToolbar = () => {
    return (
        <>
            <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
            <BaseConfig priority={"primary"}>
                <SharedPlugins />
                <Plugin
                    name={"floatingLinkEditor"}
                    element={<FloatingLinkEditorPlugin LinkForm={LexicalLinkForm} />}
                />
                <ToolbarElement name="fontSize" element={<FontSizeAction />} />
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
            </BaseConfig>
        </>
    );
};

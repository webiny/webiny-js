import React, { FC } from "react";
import {
    TypographyAction,
    LexicalEditorConfig,
    FontSizeAction,
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
    QuoteAction
} from "@webiny/lexical-editor";
import { TypographyDropDown } from "~/admin/components/LexicalCmsEditor/TypographyDropDown";
import { CompositionScope } from "@webiny/react-composition";
import { WebinyListPlugin } from "@webiny/lexical-editor/plugins/WebinyListPLugin/WebinyListPlugin";
import {
    ClickableLinkPlugin,
    CodeHighlightPlugin,
    FloatingLinkEditorPlugin,
    LinkPlugin
} from "@webiny/lexical-editor";

const { ToolbarElement, Plugin } = LexicalEditorConfig;

export const LexicalEditorCmsPlugin: FC = () => {
    return (
        <>
            <LexicalEditorConfig>
                <CompositionScope name={"cms"}>
                    <ToolbarElement name="fontSize" element={<FontSizeAction />} />
                    <ToolbarElement name="fontColor" element={<FontColorAction />} />
                    <ToolbarElement name="typography" element={<TypographyAction />} />
                    <ToolbarElement name="divider1" element={<Divider />} />
                    <ToolbarElement name="boldAction" element={<BoldAction />} />
                    <ToolbarElement name="italicAction" element={<ItalicAction />} />
                    <ToolbarElement name="underlineAction" element={<UnderlineAction />} />
                    <ToolbarElement name="codeHighlightAction" element={<CodeHighlightAction />} />
                    <ToolbarElement name="divider2" element={<Divider />} />
                    <ToolbarElement name="numberedListAction" element={<NumberedListAction />} />
                    <ToolbarElement name="bulletListAction" element={<BulletListAction />} />
                    <ToolbarElement name="divider" element={<Divider />} />
                    <ToolbarElement name="imageAction" element={<ImageAction />} />
                    <ToolbarElement name="divider3" element={<Divider />} />
                    <ToolbarElement name="linkAction" element={<LinkAction />} />
                    <ToolbarElement name="quoteAction" element={<QuoteAction />} />
                    <Plugin name={"LinkPlugin"} element={<LinkPlugin />} />
                    <Plugin name={"WebinyListPlugin"} element={<WebinyListPlugin />} />
                    <Plugin name={"CodeHighlightPlugin"} element={<CodeHighlightPlugin />} />
                    <Plugin name={"ClickableLinkPlugin"} element={<ClickableLinkPlugin />} />
                    <Plugin
                        name={"FloatingLinkEditorPlugin"}
                        element={<FloatingLinkEditorPlugin anchorElem={document.body} />}
                    />
                </CompositionScope>
                <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
            </LexicalEditorConfig>
        </>
    );
};

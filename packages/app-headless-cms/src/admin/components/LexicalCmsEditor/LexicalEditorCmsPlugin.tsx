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
    QuoteAction,
    ImagesPlugin,
    QuotePlugin,
    CodeHighlightPlugin,
    FloatingLinkEditorPlugin,
    LinkPlugin,
    ListPlugin,
    TypographyPlugin,
    FontColorPlugin,
    TextAlignmentAction
} from "@webiny/lexical-editor";
import { TypographyDropDown } from "~/admin/components/LexicalCmsEditor/TypographyDropDown";
import { CompositionScope } from "@webiny/react-composition";

const { ToolbarElement, Plugin } = LexicalEditorConfig;

export const LexicalEditorCmsPlugin: FC = () => {
    return (
        <CompositionScope name={"cms"}>
            <LexicalEditorConfig>
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
                <ToolbarElement name="divider" element={<Divider />} />
                <ToolbarElement name="image" element={<ImageAction />} />
                <ToolbarElement name="divider3" element={<Divider />} />
                <ToolbarElement name="link" element={<LinkAction />} />
                <ToolbarElement name="quote" element={<QuoteAction />} />
                <Plugin name={"fontColor"} element={<FontColorPlugin />} />
                <Plugin name={"list"} element={<ListPlugin />} />
                <Plugin name={"codeHighlight"} element={<CodeHighlightPlugin />} />
                <Plugin name={"typography"} element={<TypographyPlugin />} />
                <Plugin name={"link"} element={<LinkPlugin />} />
                <Plugin
                    name={"floatingLinkEditor"}
                    element={<FloatingLinkEditorPlugin anchorElem={document.body} />}
                />
                <Plugin name={"images"} element={<ImagesPlugin />} />
                <Plugin name={"quote"} element={<QuotePlugin />} />
                <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
            </LexicalEditorConfig>
        </CompositionScope>
    );
};

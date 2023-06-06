import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import {
    AddStaticToolbarAction,
    BoldAction,
    BulletListAction,
    CodeHighlightAction,
    Divider,
    FontColorAction,
    FontSizeAction,
    ImageAction,
    ItalicAction,
    LinkAction,
    NumberedListAction,
    QuoteAction,
    TypographyAction,
    UnderlineAction
} from "@webiny/lexical-editor";

export const RichTextStaticToolbarPreset = () => {
    return (
        <CompositionScope name={"cms"}>
            <AddStaticToolbarAction element={<FontSizeAction />} />
            <AddStaticToolbarAction element={<FontColorAction />} />
            <AddStaticToolbarAction element={<TypographyAction />} />
            <AddStaticToolbarAction element={<Divider />} />
            <AddStaticToolbarAction element={<BoldAction />} />
            <AddStaticToolbarAction element={<ItalicAction />} />
            <AddStaticToolbarAction element={<UnderlineAction />} />
            <AddStaticToolbarAction element={<CodeHighlightAction />} />
            <AddStaticToolbarAction element={<Divider />} />
            <AddStaticToolbarAction element={<NumberedListAction />} />
            <AddStaticToolbarAction element={<BulletListAction />} />
            <AddStaticToolbarAction element={<Divider />} />
            <AddStaticToolbarAction element={<ImageAction />} />
            <AddStaticToolbarAction element={<Divider />} />
            <AddStaticToolbarAction element={<LinkAction />} />
            <AddStaticToolbarAction element={<QuoteAction />} />
        </CompositionScope>
    );
};

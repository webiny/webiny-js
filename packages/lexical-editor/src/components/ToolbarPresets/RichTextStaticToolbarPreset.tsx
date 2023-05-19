import React from "react";
import { BoldAction } from "~/components/ToolbarActions/BoldAction";
import { ItalicAction } from "~/components/ToolbarActions/ItalicAction";
import { UnderlineAction } from "~/components/ToolbarActions/UnderlineAction";
import { CodeHighlightAction } from "~/components/ToolbarActions/CodeHighlightAction";
import { LinkAction } from "~/components/ToolbarActions/LinkAction";
import { FontSizeAction } from "~/components/ToolbarActions/FontSizeAction";
import { Divider } from "~/ui/Divider";
import { NumberedListAction } from "~/components/ToolbarActions/NumberedListAction";
import { BulletListAction } from "~/components/ToolbarActions/BulletListAction";
import { QuoteAction } from "~/components/ToolbarActions/QuoteAction";
import { FontColorAction } from "~/components/ToolbarActions/FontColorAction";
import { TypographyAction } from "~/components/ToolbarActions/TypographyAction";
import {AddStaticToolbarAction} from "~/components/AddStaticToolbarAction";

export const RichTextStaticToolbarPreset = () => {
    return (
        <>
            <AddStaticToolbarAction element={<FontSizeAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<FontColorAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<TypographyAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<Divider />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<BoldAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<ItalicAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<UnderlineAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<CodeHighlightAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<Divider />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<NumberedListAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<BulletListAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<Divider />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<LinkAction />} type={"rich-text-static-toolbar"} />
            <AddStaticToolbarAction element={<QuoteAction />} type={"rich-text-static-toolbar"} />
        </>
    );
};

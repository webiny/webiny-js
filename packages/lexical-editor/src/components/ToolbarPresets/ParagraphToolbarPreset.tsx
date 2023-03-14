import React from "react";
import { BoldAction } from "~/components/ToolbarActions/BoldAction";
import { AddToolbarAction } from "~/components/AddToolbarAction";
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

export const ParagraphToolbarPreset = () => {
    return (
        <>
            <AddToolbarAction element={<FontSizeAction />} type={"paragraph"} />
            <AddToolbarAction element={<FontColorAction />} type={"paragraph"} />
            <AddToolbarAction element={<Divider />} type={"paragraph"} />
            <AddToolbarAction element={<BoldAction />} type={"paragraph"} />
            <AddToolbarAction element={<ItalicAction />} type={"paragraph"} />
            <AddToolbarAction element={<UnderlineAction />} type={"paragraph"} />
            <AddToolbarAction element={<CodeHighlightAction />} type={"paragraph"} />
            <AddToolbarAction element={<Divider />} type={"paragraph"} />
            <AddToolbarAction element={<NumberedListAction />} type={"paragraph"} />
            <AddToolbarAction element={<BulletListAction />} type={"paragraph"} />
            <AddToolbarAction element={<Divider />} type={"paragraph"} />
            <AddToolbarAction element={<LinkAction />} type={"paragraph"} />
            <AddToolbarAction element={<QuoteAction />} type={"paragraph"} />
        </>
    );
};

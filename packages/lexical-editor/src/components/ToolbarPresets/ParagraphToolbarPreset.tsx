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
import { TextAlignmentAction } from "~/components/ToolbarActions/TextAlignmentAction";
import { LexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig";

const { ToolbarElement } = LexicalEditorConfig;

export const ParagraphToolbarPreset = () => {
    return (
        <LexicalEditorConfig>
            <ToolbarElement name="FontSizeAction" element={<FontSizeAction />} />
            <ToolbarElement name="FontColorAction" element={<FontColorAction />} />
            <ToolbarElement name="TypographyAction" element={<TypographyAction />} />
            <ToolbarElement name="TextAlignmentAction" element={<TextAlignmentAction />} />
            <ToolbarElement name="Divider1" element={<Divider />} />
            <ToolbarElement name="BoldAction" element={<BoldAction />} />
            <ToolbarElement name="ItalicAction" element={<ItalicAction />} />
            <ToolbarElement name="UnderlineAction" element={<UnderlineAction />} />
            <ToolbarElement name="CodeHighlightAction" element={<CodeHighlightAction />} />
            <ToolbarElement name="Divider2" element={<Divider />} />
            <ToolbarElement name="NumberedListAction" element={<NumberedListAction />} />
            <ToolbarElement name="BulletListAction" element={<BulletListAction />} />
            <ToolbarElement name="Divider3" element={<Divider />} />
            <ToolbarElement name="LinkAction" element={<LinkAction />} />
            <ToolbarElement name="QuoteAction" element={<QuoteAction />} />
        </LexicalEditorConfig>
    );
};

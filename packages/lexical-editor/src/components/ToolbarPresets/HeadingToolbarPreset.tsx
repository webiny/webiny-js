import React from "react";
import { BoldAction } from "~/components/ToolbarActions/BoldAction";
import { ItalicAction } from "~/components/ToolbarActions/ItalicAction";
import { UnderlineAction } from "~/components/ToolbarActions/UnderlineAction";
import { CodeHighlightAction } from "~/components/ToolbarActions/CodeHighlightAction";
import { LinkAction } from "~/components/ToolbarActions/LinkAction";
import { FontSizeAction } from "~/components/ToolbarActions/FontSizeAction";
import { Divider } from "~/ui/Divider";
import { FontColorAction } from "~/components/ToolbarActions/FontColorAction";
import { TypographyAction } from "~/components/ToolbarActions/TypographyAction";
import { TextAlignmentAction } from "~/components/ToolbarActions/TextAlignmentAction";
import { LexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig";

const { ToolbarElement } = LexicalEditorConfig;

export const HeadingToolbarPreset = () => {
    return (
        <LexicalEditorConfig>
            <ToolbarElement name={"fontSize"} element={<FontSizeAction />} />
            <ToolbarElement name={"fontColor"} element={<FontColorAction />} />
            <ToolbarElement name={"typography"} element={<TypographyAction />} />
            <ToolbarElement name={"textAlignment"} element={<TextAlignmentAction />} />
            <ToolbarElement name={"divider1"} element={<Divider />} />
            <ToolbarElement name={"bold"} element={<BoldAction />} />
            <ToolbarElement name={"italic"} element={<ItalicAction />} />
            <ToolbarElement name={"underline"} element={<UnderlineAction />} />
            <ToolbarElement name={"codeHighlight"} element={<CodeHighlightAction />} />
            <ToolbarElement name={"divider2"} element={<Divider />} />
            <ToolbarElement name={"link"} element={<LinkAction />} />
        </LexicalEditorConfig>
    );
};

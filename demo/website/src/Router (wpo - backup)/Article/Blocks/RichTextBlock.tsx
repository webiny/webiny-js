import React from "react";
import { GenericBlock, RichTextBlock } from "@demo/shared";
import { RichTextLexicalRenderer } from "@webiny/react-rich-text-lexical-renderer";

export const isRichTextBlock = (block: GenericBlock): block is RichTextBlock => {
    return block.__typename === "Article_Content_Richtextfield";
};

export const RichTextBlockComponent = ({ block }: { block: RichTextBlock }) => {
    return <RichTextLexicalRenderer value={block.content} />;
};

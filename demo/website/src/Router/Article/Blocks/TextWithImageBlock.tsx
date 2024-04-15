import React from "react";
import { GenericBlock, TextWithImageBlock } from "@demo/shared";
import { RichTextLexicalRenderer } from "@webiny/react-rich-text-lexical-renderer";

export const isTextWithImageBlock = (block: GenericBlock): block is TextWithImageBlock => {
    return block.__typename === "Article_Content_Textwithimageblock";
};

export const TextWithImageBlockComponent = ({ block }: { block: TextWithImageBlock }) => {
    return (
        <div>
            <h3>{block.title}</h3>
            <img src={block.image} alt={block.title} />
            return <RichTextLexicalRenderer value={block.content} />;
        </div>
    );
};

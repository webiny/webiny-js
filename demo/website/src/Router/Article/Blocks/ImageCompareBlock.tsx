import React from "react";
import { GenericBlock, ImageCompareBlock } from "@demo/shared";

export const isImageCompareBlock = (block: GenericBlock): block is ImageCompareBlock => {
    console.log(block.__typename);
    return block.__typename === "Article_Content_Imagecompare";
};

export const ImageCompareBlockComponent = ({ block }: { block: ImageCompareBlock }) => {
    console.log(block);
    return <div>This is the block</div>;
};

import React from "react";
import { GenericBlock, BannerBlock } from "@demo/shared";
import { Link } from "@webiny/react-router";

export const isBannerBlock = (block: GenericBlock): block is BannerBlock => {
    return block.__typename === "Article_Content_Banner";
};

export const BannerBlockComponent = ({ block }: { block: BannerBlock }) => {
    return (
        <div>
            <h3>{block.title}</h3>
            <img src={block.image} alt={block.title} />
            <Link to={block.actionUrl}>{block.actionLabel}</Link>
        </div>
    );
};

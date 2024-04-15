import React from "react";
import { GenericBlock, HeroBlock } from "@demo/shared";
import { Link } from "@webiny/react-router";

export const isHeroBlock = (block: GenericBlock): block is HeroBlock => {
    return block.__typename === "Article_Content_Hero";
};

export const HeroBlockComponent = ({ block }: { block: HeroBlock }) => {
    return (
        <div>
            <h3>{block.title}</h3>
            <p>{block.subtitle}</p>
            <p>{block.description}</p>
            <Link to={block.callToActionButtonUrl}>{block.callToActionButtonLabel}</Link>
        </div>
    );
};

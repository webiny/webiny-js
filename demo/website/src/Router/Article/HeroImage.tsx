import React from "react";
import { ArticleHeroImage } from "@demo/shared";

interface HeroImageProps {
    heroImages: ArticleHeroImage[];
}

export const HeroImage = ({ heroImages }: HeroImageProps) => {
    // TODO: decide on which culture group to use

    const heroImage = heroImages[0];

    return <img src={heroImage.image} />;
};

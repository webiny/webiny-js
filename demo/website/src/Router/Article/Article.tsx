import React from "react";
import { ReadonlyArticle } from "@demo/shared";
import { Helmet } from "react-helmet";
import { HeroImage } from "./HeroImage";
import styled from "@emotion/styled";
import {
    BannerBlockComponent,
    HeroBlockComponent,
    isBannerBlock,
    isHeroBlock,
    isRichTextBlock,
    isTextWithImageBlock,
    isThreeGridBoxBlock,
    RichTextBlockComponent,
    TextWithImageBlockComponent,
    ThreeGridBoxBlockComponent
} from "./Blocks";

const ArticlesContainer = styled.div`
    margin: 50px;
`;

interface ArticleProps {
    article: ReadonlyArticle;
}

export const Article = ({ article }: ArticleProps) => {
    return (
        <ArticlesContainer>
            <Helmet>
                <title>{article.title}</title>
                {article.seoTitle && <meta name="title" content={article.seoTitle} />}
                {article.seoDescription && (
                    <meta name="description" content={article.seoDescription} />
                )}
                {(article.seoMetaTags || []).map(({ tagName, tagValue }, index) => (
                    <meta key={index} name={tagName} content={tagValue} />
                ))}
            </Helmet>
            <h2>{article.title}</h2>
            <HeroImage heroImages={article.heroImage} />
            {article.content.map((block, index) => {
                if (isRichTextBlock(block)) {
                    return <RichTextBlockComponent key={index} block={block} />;
                }
                if (isTextWithImageBlock(block)) {
                    return <TextWithImageBlockComponent key={index} block={block} />;
                }
                if (isBannerBlock(block)) {
                    return <BannerBlockComponent key={index} block={block} />;
                }
                if (isHeroBlock(block)) {
                    return <HeroBlockComponent key={index} block={block} />;
                }
                if (isThreeGridBoxBlock(block)) {
                    return <ThreeGridBoxBlockComponent key={index} block={block} />;
                }
                return null;
            })}
        </ArticlesContainer>
    );
};

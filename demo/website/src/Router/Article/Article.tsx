import React from "react";
import { ReadonlyArticle } from "@demo/shared";
import { Helmet } from "react-helmet";
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
import { Breadcrumbs } from "./Breadcrumbs";

const ArticlesContainer = styled.div`
    margin: 0 auto;
    display: flex;
    max-width: 1100px;
    flex-direction: column;
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

            <Breadcrumbs article={article} />

            <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
                    {article.title}
                </span>
            </h1>
            <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
                {article.description || article.seoDescription}
            </p>

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
                return <pre key={index}>{JSON.stringify(block)}</pre>;
            })}
        </ArticlesContainer>
    );
};

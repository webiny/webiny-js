import React from "react";
import { ReadonlyArticle } from "@demo/shared";
import { Helmet } from "react-helmet";
import { HeroImage } from "./HeroImage";
import styled from "@emotion/styled";
import { Link } from "@webiny/react-router";

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
    margin: 50px auto;
    display: flex;
    width: 1100px;
    flex-direction: column;
`;

interface ArticleProps {
    article: ReadonlyArticle;
}

export const Article = ({ article }: ArticleProps) => {
    console.log(article);
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

            <nav className="flex mb-4" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                        <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                        </svg>
                        Home
                    </Link>
                    </li>
                    <li>
                    <div className="flex items-center">
                        <svg className="w-3 h-3 text-gray-400 mx-1 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                        </svg>
                        <Link to={"/"+article.region?.slug+'-'+article.language?.slug} className="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white">{article.region?.title + ' / '+ article.language?.name}</Link>
                    </div>
                    </li>
                    <li aria-current="page">
                    <div className="flex items-center">
                        <svg className="w-3 h-3 text-gray-400 mx-1 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                        </svg>
                        <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">{article.title}</span>
                    </div>
                    </li>
                </ol>
            </nav>

            <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">{article.title}</span>
            </h1>
            <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">{article.description || article.seoDescription}</p>

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

import React from "react";
import styled from "@emotion/styled";
import { ReadonlyArticle } from "@demo/shared";
import { Link } from "@webiny/react-router";
import { useContentSettings } from "../../ContentSettings";

const ArticlesContainer = styled.div`
    margin: 50px;
    display: flex;
    gap: 25px;
`;

const ArticleLink = styled(Link)``;

interface ArticlesListProps {
    articles: Omit<ReadonlyArticle, "content">[];
}

export const ArticlesList = ({ articles }: ArticlesListProps) => {
    const { getLink } = useContentSettings();

    return (
        <ArticlesContainer>
            {articles.map(article => {
                return (
                    <div
                        key={article.id}
                        className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
                    >
                        <ArticleLink to={getLink(article.slug)}>
                            <img className="rounded-t-lg" src={article.heroImage[0].image} alt="" />
                        </ArticleLink>
                        <div className="p-5">
                            <ArticleLink to={getLink(article.slug)}>
                                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    {article.title}
                                </h5>
                            </ArticleLink>
                            <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                                {article.description || article.seoDescription}
                            </p>
                            <ArticleLink
                                to={getLink(article.slug)}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            >
                                Read more
                                <svg
                                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 14 10"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M1 5h12m0 0L9 1m4 4L9 9"
                                    />
                                </svg>
                            </ArticleLink>
                        </div>
                    </div>
                );
            })}
        </ArticlesContainer>
    );
};

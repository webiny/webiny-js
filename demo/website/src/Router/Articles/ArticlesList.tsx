import React from "react";
import styled from "@emotion/styled";
import { ReadonlyArticle } from "@demo/shared";
import { Link } from "@webiny/react-router";
import { useContentSettings } from "../../ContentSettings";

const ArticlesContainer = styled.div`
    margin: 50px;
`;

const ArticleListItem = styled.div`
    border: 1px solid #5c6670;
    border-radius: 20px;
    padding: 20px;
`;

const ArticleTitle = styled.div`
    font-weight: bold;
`;
const ArticleDescription = styled.div``;
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
                    <ArticleListItem key={article.id}>
                        <ArticleTitle>{article.title}</ArticleTitle>
                        <ArticleDescription>
                            {article.description || article.seoDescription}
                        </ArticleDescription>
                        <ArticleLink to={getLink(article.slug)}>Read Article</ArticleLink>
                    </ArticleListItem>
                );
            })}
        </ArticlesContainer>
    );
};

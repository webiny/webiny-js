import React from "react";
import { useContentSlug } from "../../ContentSettings";
import { useArticle } from "./useArticle";
import { Article as Content } from "./Article";
import { LoadingSkeleton } from "../../LoadingSkeleton";
import styled from "@emotion/styled";

const Article = styled(Content)`
    margin: 50px auto;
`;

export const ArticleView = () => {
    const { slug } = useContentSlug();
    const { loading, article } = useArticle(slug);

    if (loading) {
        return <LoadingSkeleton />;
    }

    return <Article article={article!} />;
};

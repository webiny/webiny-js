import React from "react";
import { useContentSlug } from "../../ContentSettings";
import { useArticle } from "./useArticle";
import { Article } from "./Article";
import { LoadingSkeleton } from "../../LoadingSkeleton";

export const ArticleView = () => {
    const { slug } = useContentSlug();
    const { loading, article } = useArticle(slug);

    if (loading) {
        return <LoadingSkeleton />;
    }

    return <Article article={article!} />;
};

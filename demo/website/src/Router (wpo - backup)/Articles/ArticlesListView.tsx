import React from "react";
import { useArticlesList } from "./useArticlesList";
import { ArticlesList } from "./ArticlesList";
import { LoadingSkeleton } from "../../LoadingSkeleton";

export const ArticlesListView = () => {
    const { loading, articles } = useArticlesList();

    return loading ? <LoadingSkeleton /> : <ArticlesList articles={articles} />;
};

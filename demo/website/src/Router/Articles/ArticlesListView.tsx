import React from "react";
import { useArticlesList } from "./useArticlesList";
import { ArticlesList } from "./ArticlesList";

export const ArticlesListView = () => {
    const { loading, articles } = useArticlesList();

    return loading ? <>Load list of articles...</> : <ArticlesList articles={articles} />;
};

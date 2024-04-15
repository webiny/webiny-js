import React from "react";
import { Helmet } from "react-helmet";
import { useRouter } from "@webiny/react-router";
import { useContentSlug } from "../../ContentSettings";
import { useArticle } from "./useArticle";
import { Article } from "./Article";

export const ArticleView = () => {
    const { slug } = useContentSlug();
    const { loading, article } = useArticle(slug);

    if (loading) {
        return <div>Loading article...</div>;
    }

    return <Article article={article!} />;
};

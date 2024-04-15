import React from "react";
import { ArticleView } from "./Article/ArticleView";
import { ArticlesListView } from "./Articles/ArticlesListView";
import { Layout } from "./Layout/Layout";
import { useContentSlug } from "../ContentSettings";

export const Router = () => {
    const { slug } = useContentSlug();

    switch (slug) {
        case "/":
            return (
                <Layout>
                    <ArticlesListView />
                </Layout>
            );
        default:
            return (
                <Layout>
                    <ArticleView />
                </Layout>
            );
    }
};

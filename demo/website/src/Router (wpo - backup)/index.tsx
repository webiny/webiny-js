import React from "react";
import { ArticleView } from "./Article/ArticleView";
import { ArticlesListView } from "./Articles/ArticlesListView";
import { Layout } from "./Layout/Layout";
import { useContentSlug } from "../ContentSettings";
import { LivePreview } from "./Article/LivePreview";

export const Router = () => {
    const { slug } = useContentSlug();

    switch (true) {
        case slug === "/":
            return (
                <Layout>
                    <ArticlesListView />
                </Layout>
            );
        case slug.startsWith("/live-preview"):
            return <LivePreview />;
        case slug.length > 1:
            return (
                <Layout>
                    <ArticleView />
                </Layout>
            );
        default:
            return null;
    }
};

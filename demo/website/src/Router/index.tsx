import React from "react";
import { ArticleView } from "./Article/ArticleView";
import { ArticlesListView } from "./Articles/ArticlesListView";
import { Layout } from "./Layout/Layout";
import { useContentSlug } from "../ContentSettings";
import { useRouter } from "@webiny/react-router";

export const Router = () => {
    const { search } = useRouter();
    const { slug } = useContentSlug();

    const isPreview = search[0].has("preview");

    switch (true) {
        case slug === "/":
            return (
                <Layout>
                    <ArticlesListView />
                </Layout>
            );
        case slug.length > 1:
            return (
                <Layout preview={isPreview}>
                    <ArticleView />
                </Layout>
            );
        default:
            return null;
    }
};

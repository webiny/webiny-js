import React from "react";
import { Page as PageType } from "~/types";
import { Content } from "./Content";
import { PageProvider } from "~/contexts/Page";

export interface PageProps {
    page: PageType;
    layout?: React.ComponentType<{ children: React.ReactNode }>;
    layoutProps?: Record<string, any>;
}

export const Page = (props: PageProps) => {
    const { page, layout } = props;

    let content = <Content content={page.content} />;

    if (layout) {
        const Layout = layout;
        content = <Layout>{content}</Layout>;
    }

    return (
        <PageProvider key={page.id} {...props}>
            {content}
        </PageProvider>
    );
};
